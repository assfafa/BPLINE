/**
 * 生成 UUID
 * 优先使用浏览器原生 crypto.randomUUID
 * 不支持时降级为 getRandomValues 或 Math.random
 * @example
 * UUID();
 * @returns UUID 字符串
 */
const UUID: () => string = (): string => {
    // 区分输入数据形态，使用与实际类型匹配的处理方式。
    if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") {
        // 区分输入数据形态，使用与实际类型匹配的处理方式。
        if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
            /**
             * 按 UUID 第四版格式生成随机位和变体位。
             * @param char 当前待替换的字符
             * @example
             * CreateUuidDigit(char);
             * @returns 一个十六进制字符。
             */
            const CreateUuidDigit = (char: string): string => {
                const random = Math.floor(Math.random() * 16);
                let value;
                // 普通 UUID 位使用随机值，变体位按规范保留固定高位。
                if (char === "x") {
                    value = random;
                } else {
                    value = (random & 0x3) | 0x8;
                }
                return value.toString(16);
            };
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, CreateUuidDigit);
        } else {
            const bytes = new Uint8Array(16);
            crypto.getRandomValues(bytes);
            bytes[6] = (bytes[6] & 0x0f) | 0x40;
            bytes[8] = (bytes[8] & 0x3f) | 0x80;
            /**
             * 将随机字节编码为补齐两位的十六进制文本。
             * @param value 本次输入值
             * @example
             * FormatRandomByte(value);
             * @returns 两位十六进制文本。
             */
            const FormatRandomByte = (value: number) => {
                return value.toString(16).padStart(2, "0");
            };
            const hex = Array.from(bytes, FormatRandomByte);
            return [
                hex.slice(0, 4).join(""),
                hex.slice(4, 6).join(""),
                hex.slice(6, 8).join(""),
                hex.slice(8, 10).join(""),
                hex.slice(10, 16).join(""),
            ].join("-");
        }
    } else {
        return crypto.randomUUID();
    }
};
export { UUID };
