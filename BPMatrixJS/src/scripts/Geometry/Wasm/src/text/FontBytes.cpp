#include "Font.hpp"
#include <hb-ot.h>
#include <woff2/decode.h>
#include <miniz_tinfl.h>
#include <algorithm>
#include <cstring>
#include <stdexcept>

namespace bptext {
namespace {

constexpr size_t maxFontBytes = 64 * 1024 * 1024;

/** Read a checked big-endian sfnt field. */
uint32_t Read(const uint8_t* bytes, size_t size, size_t offset, size_t count) {
    if (offset <= size && count <= size - offset) {
        uint32_t value = 0;
        for (size_t i = 0; i < count; ++i) {
            value = (value << 8) | bytes[offset + i];
        }
        return value;
    } else {
        throw std::runtime_error("Truncated font header.");
    }
}

/** Store a big-endian field while reconstructing a WOFF sfnt directory. */
void Write(std::vector<uint8_t>& data, size_t offset, uint32_t value, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        data[offset + count - i - 1] = value & 255;
        value >>= 8;
    }
}

/** Decode WOFF1 with the MIT miniz inflater, preserving each original font table. */
std::vector<uint8_t> DecodeWoff(const uint8_t* bytes, size_t size) {
    const size_t length = Read(bytes, size, 16, 4);
    const size_t count = Read(bytes, size, 12, 2);
    if (length >= 12 + count * 16 && length <= maxFontBytes && count > 0 && count <= 4096) {
        std::vector<uint8_t> output(length, 0);
        Write(output, 0, Read(bytes, size, 4, 4), 4);
        Write(output, 4, count, 2);
        unsigned power = 1;
        unsigned selector = 0;
        while (power * 2 <= count) {
            power *= 2;
            ++selector;
        }
        Write(output, 6, power * 16, 2);
        Write(output, 8, selector, 2);
        Write(output, 10, count * 16 - power * 16, 2);
        size_t cursor = 12 + count * 16;
        for (size_t i = 0; i < count; ++i) {
            const size_t entry = 44 + i * 20;
            const size_t offset = Read(bytes, size, entry + 4, 4);
            const size_t compressed = Read(bytes, size, entry + 8, 4);
            const size_t original = Read(bytes, size, entry + 12, 4);
            // All offsets are checked before calling the native inflater.
            if (offset <= size && compressed <= size - offset && compressed <= original &&
                cursor <= length && original <= length - cursor) {
                Write(output, 12 + i * 16, Read(bytes, size, entry, 4), 4);
                Write(output, 16 + i * 16, Read(bytes, size, entry + 16, 4), 4);
                Write(output, 20 + i * 16, cursor, 4);
                Write(output, 24 + i * 16, original, 4);
                if (compressed == original) {
                    std::memcpy(output.data() + cursor, bytes + offset, original);
                } else {
                    const size_t decoded = tinfl_decompress_mem_to_mem(output.data() + cursor, original,
                        bytes + offset, compressed, TINFL_FLAG_PARSE_ZLIB_HEADER);
                    if (decoded != original) {
                        throw std::runtime_error("Invalid WOFF compressed table.");
                    }
                }
                cursor += (original + 3) & ~size_t(3);
            } else {
                throw std::runtime_error("Invalid WOFF table range.");
            }
        }
        return output;
    } else {
        throw std::runtime_error("Invalid WOFF font size.");
    }
}

/** Expand compressed fonts before handing sfnt bytes to HarfBuzz. */
std::vector<uint8_t> Decode(const uint8_t* bytes, size_t size) {
    const uint32_t signature = Read(bytes, size, 0, 4);
    if (size <= maxFontBytes) {
        if (signature == 0x774f4632) {
            const size_t length = woff2::ComputeWOFF2FinalSize(bytes, size);
            if (length > 0 && length <= maxFontBytes) {
                std::vector<uint8_t> output(length);
                if (woff2::ConvertWOFF2ToTTF(output.data(), length, bytes, size)) {
                    return output;
                } else {
                    throw std::runtime_error("Invalid WOFF2 font.");
                }
            } else {
                throw std::runtime_error("Invalid WOFF2 expanded size.");
            }
        } else if (signature == 0x774f4646) {
            return DecodeWoff(bytes, size);
        } else if (signature == 0x00010000 || signature == 0x4f54544f || signature == 0x74727565) {
            return {bytes, bytes + size};
        } else {
            throw std::runtime_error("Expected a single TTF, OTF, WOFF or WOFF2 font.");
        }
    } else {
        throw std::runtime_error("Font exceeds the 64 MiB input limit.");
    }
}

}

Font::Font(const uint8_t* bytes, size_t length) {
    const auto decoded = Decode(bytes, length);
    hb_blob_t* blob = hb_blob_create(reinterpret_cast<const char*>(decoded.data()), decoded.size(),
        HB_MEMORY_MODE_DUPLICATE, nullptr, nullptr);
    hb_face_t* face = hb_face_create(blob, 0);
    hb_blob_destroy(blob);
    unitsPerEm = hb_face_get_upem(face);
    // HarfBuzz sanitizes table access, but an empty face is not a usable registration.
    if (hb_face_get_glyph_count(face) > 0 && unitsPerEm > 0 && unitsPerEm <= 16384) {
        font = hb_font_create(face);
        hb_face_destroy(face);
        hb_ot_font_set_funcs(font);
        hb_font_set_scale(font, unitsPerEm, unitsPerEm);
        hb_font_get_h_extents(font, &metrics);
    } else {
        hb_face_destroy(face);
        throw std::runtime_error("Font has no usable glyphs or metrics.");
    }
}

Font::~Font() {
    hb_font_destroy(font);
}

std::vector<double> Font::shape(const uint16_t* text, size_t length) const {
    hb_buffer_t* buffer = hb_buffer_create();
    hb_buffer_add_utf16(buffer, text, length, 0, length);
    hb_buffer_guess_segment_properties(buffer);
    hb_shape(font, buffer, nullptr, 0);
    unsigned count = 0;
    const auto* infos = hb_buffer_get_glyph_infos(buffer, &count);
    const auto* positions = hb_buffer_get_glyph_positions(buffer, &count);
    std::vector<double> result{0, static_cast<double>(count)};
    result.reserve(2 + count * 10);
    for (unsigned i = 0; i < count; ++i) {
        hb_glyph_extents_t bounds{};
        hb_font_get_glyph_extents(font, infos[i].codepoint, &bounds);
        const auto& p = positions[i];
        result[0] += p.x_advance;
        result.insert(result.end(), {static_cast<double>(infos[i].codepoint), static_cast<double>(infos[i].cluster),
            static_cast<double>(p.x_advance), static_cast<double>(p.y_advance),
            static_cast<double>(p.x_offset), static_cast<double>(p.y_offset),
            static_cast<double>(bounds.x_bearing), static_cast<double>(bounds.y_bearing + bounds.height),
            static_cast<double>(bounds.x_bearing + bounds.width), static_cast<double>(bounds.y_bearing)});
    }
    hb_buffer_destroy(buffer);
    return result;
}

}
