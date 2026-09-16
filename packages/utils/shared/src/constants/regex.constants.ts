/** 匹配常见的不可见控制字符 (\x00-\x1F, \x7F-\x9F) */
// eslint-disable-next-line no-control-regex -- 该规则专门用于检测 C0/C1 控制字符。
export const CONTROL_CHAR_REGEX = /[\x00-\x1f\x7f-\x9f]/;

/** 匹配 Windows 系统保留文件名 (如 CON, PRN, AUX, NUL, COM1-9, LPT1-9) */
export const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;

/** 匹配 Windows 驱动器盘符开头 (如 C:\ 或 d:/) */
export const WINDOWS_DRIVE_REGEX = /^[a-zA-Z]:[\\/]/;

/** 匹配 Windows 盘符前缀，包括盘符相对路径（如 `C:`、`D:foo`）。 */
export const WINDOWS_DRIVE_PREFIX_REGEX = /^[a-zA-Z]:/;

/** 匹配 Windows/POSIX 文件名中的非法字符及 C0/C1 控制字符。 */
// eslint-disable-next-line no-control-regex -- 文件名清洗需要显式覆盖 C0/C1 控制字符。
export const ILLEGAL_FILENAME_CHARACTER_REGEX = /[/?<>\\:*|"\x00-\x1f\x7f-\x9f]/g;

/** 匹配符合 RFC Cookie 名称 token 规则的字符串。 */
export const COOKIE_NAME_REGEX = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

/** 匹配带可选符号、小数和科学计数法的十进制数字。 */
export const DECIMAL_NUMBER_REGEX = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/iu;

/** 匹配可作为时间戳输入的整数或小数字符串。 */
export const TIMESTAMP_NUMBER_REGEX = /^[+-]?\d+(?:\.\d+)?$/;

/** 从带单位的普通数值中提取数值和单位。 */
export const BYTE_SIZE_REGEX = /^\s*([+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*([^\s]+)\s*$/iu;

/** 从带单位的非负整数字符串中提取整数和单位。 */
export const EXACT_BYTE_SIZE_REGEX = /^\s*\+?(\d+)\s*([^\s]+)\s*$/u;

/** 匹配 bit/Byte 单位的短格式。 */
export const SHORT_BYTE_UNIT_REGEX = /^([kmgtpe](?:i)?)([bB])$/iu;

/** 匹配 bit/Byte 单位的完整单词格式。 */
export const LONG_BYTE_UNIT_REGEX = /^([kmgtpe](?:i)?)(bits?|bytes?)$/iu;

/** 匹配规范化后的 bit/Byte 单位。 */
export const CANONICAL_BYTE_UNIT_REGEX = /^([KMGTPE](?:i)?)(bit|B)$/u;

/** 匹配日期格式化模板中的受支持 token。 */
export const DATE_FORMAT_TOKEN_REGEX = /YYYY|SSS|MM|DD|HH|mm|ss/g;

/** 匹配可规范化的 ISO 风格日期时间。 */
export const ISO_DATE_TIME_REGEX = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2})(\.\d+)?)?)?(Z|[+-]\d{2}:?\d{2})?$/u;

/** 从日期格式化模板中提取时间部分。 */
export const DATE_TIME_SECTION_REGEX = /HH(?:[^A-Za-z]mm)?(?:[^A-Za-z]ss)?(?:[^A-Za-z]SSS)?/;

/** 匹配 camelCase 中小写字母或数字到大写字母的单词边界。 */
export const LOWER_OR_NUMBER_TO_UPPER_REGEX = /([\p{Ll}\p{N}])(\p{Lu})/gu;

/** 匹配连续大写缩写到普通首字母大写单词的边界。 */
export const ACRONYM_TO_WORD_REGEX = /(\p{Lu}+)(\p{Lu}\p{Ll})/gu;

/** 匹配除 Unicode 字母和数字之外的字符。 */
export const NON_ALPHANUMERIC_REGEX = /[^\p{L}\p{N}]+/u;

/** 匹配正则表达式中具有特殊含义、需要转义的字符。 */
export const REGEXP_SPECIAL_CHARACTER_REGEX = /[.*+?^${}()|[\]\\]/gu;

/** 匹配 7z 技术清单中的条目路径字段。 */
export const SEVEN_Z_PATH_FIELD_REGEX = /^Path = (.*)$/m;

/** 匹配 7z 技术清单中的符号链接字段。 */
export const SEVEN_Z_SYMBOLIC_LINK_FIELD_REGEX = /^Symbolic Link = (.+)$/m;

/** 匹配 7z 技术清单中的硬链接字段。 */
export const SEVEN_Z_HARD_LINK_FIELD_REGEX = /^Hard Link = (.+)$/m;

/** 匹配 7z 技术清单中的目录标记。 */
export const SEVEN_Z_FOLDER_FIELD_REGEX = /^Folder = \+$/m;

/**
 * IPv4 映射 IPv6：
 *
 * ::ffff:192.168.1.1
 */
export const IPV4_MAPPED_PREFIX = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i;
