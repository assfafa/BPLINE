cmake_minimum_required(VERSION 3.20)
project(BPTextWasm LANGUAGES C CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Only decoder/runtime sources enter the binary; upstream tools and tests stay in the cache.
set(HB "${DEPENDENCIES}/harfbuzz-14.6.0")
set(WOFF "${DEPENDENCIES}/woff2-1.0.2")
set(BROTLI "${DEPENDENCIES}/brotli-1.2.0")
set(MINIZ "${DEPENDENCIES}/miniz-3.1.2")
file(GLOB BROTLI_SOURCES "${BROTLI}/c/common/*.c" "${BROTLI}/c/dec/*.c")
if(NOT EXISTS "${CMAKE_BINARY_DIR}/miniz_export.h")
    file(WRITE "${CMAKE_BINARY_DIR}/miniz_export.h" "#pragma once\n#define MINIZ_EXPORT\n")
endif()

add_library(text_dependencies STATIC
    "${HB}/src/harfbuzz.cc"
    "${WOFF}/src/table_tags.cc" "${WOFF}/src/variable_length.cc"
    "${WOFF}/src/woff2_common.cc" "${WOFF}/src/woff2_dec.cc" "${WOFF}/src/woff2_out.cc"
    "${MINIZ}/miniz_tinfl.c" ${BROTLI_SOURCES})
target_include_directories(text_dependencies PUBLIC
    "${HB}/src" "${WOFF}/include" "${BROTLI}/c/include" "${MINIZ}" "${CMAKE_BINARY_DIR}")
target_compile_definitions(text_dependencies PRIVATE
    HB_NO_MT HB_NO_MMAP HB_NO_SETLOCALE HB_NO_OPEN HB_NO_SUBSET
    MINIZ_NO_ARCHIVE_APIS MINIZ_NO_STDIO MINIZ_NO_TIME)
target_compile_options(text_dependencies PRIVATE -O2 -fexceptions)

add_executable(TextWasm Bridge.cpp FontBytes.cpp Glyph.cpp Text.cpp Tessellation.cpp)
target_link_libraries(TextWasm PRIVATE text_dependencies)
target_compile_options(TextWasm PRIVATE -O2 -fexceptions -Wall -Wextra)
target_link_options(TextWasm PRIVATE
    -O2 --no-entry -fexceptions
    "-sMODULARIZE=1" "-sEXPORT_ES6=1" "-sEXPORT_NAME=CreateTextWasm"
    "-sENVIRONMENT=web,worker" "-sFILESYSTEM=0" "-sALLOW_MEMORY_GROWTH=1"
    "-sINITIAL_MEMORY=33554432" "-sMAXIMUM_MEMORY=536870912"
    "-sEXPORTED_FUNCTIONS=['_malloc','_free']"
    "-sEXPORTED_RUNTIME_METHODS=['HEAPU8','HEAPU16','HEAPF64']")
set_target_properties(TextWasm PROPERTIES SUFFIX ".js" RUNTIME_OUTPUT_DIRECTORY "${OUTPUT}")
