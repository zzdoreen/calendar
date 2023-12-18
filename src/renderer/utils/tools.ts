/**
 * 本地存储读取并反JSON序列化
 * @param key 键名
 * @param defaultValue 默认值，当反JSON序列化出错时返回该值
 */
// eslint-disable-next-line import/prefer-default-export
export function getLocalStorage<T extends any>(
  key: string,
  defaultValue = null as T,
) {
  let result: T;
  try {
    result = JSON.parse(window.localStorage.getItem(key) as string);
    // eslint-disable-next-line no-throw-literal
    if (result === null) throw '值为null，将返回默认值'; // 不存在时，返回默认值
  } catch {
    // 避免缓存的原因，造成解析失败
    getLocalStorage(key, defaultValue);
    result = defaultValue;
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    return result!;
  }
}
