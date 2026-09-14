let currentId = 0;

/**
 * 获取全局唯一的递增对象 ID。
 * @returns 新对象的 ID
 */
const GETID = (): number => {
    const id = currentId;
    currentId += 1;
    return id;
};

export { GETID };
