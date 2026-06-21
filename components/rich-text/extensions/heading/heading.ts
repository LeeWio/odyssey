// 导入 Tiptap 原生 Heading 扩展和属性合并工具
import { Heading as TiptapHeading } from "@tiptap/extension-heading";
import { mergeAttributes } from "@tiptap/react";

// 定义合法的标题级别类型（1~6）
type Levels = 1 | 2 | 3 | 4 | 5 | 6;

// 映射每个标题级别到你提供的 CSS 类名
// 注意：这里只使用 .typography--h{level}，不包含其他修饰类（如 color、align）
// 如果你需要动态添加修饰类（比如通过菜单设置居中），可以后续扩展 attrs
const headingClasses: Record<Levels, string> = {
  1: "typography--h1",
  2: "typography--h2",
  3: "typography--h3",
  4: "typography--h4",
  5: "typography--h5",
  6: "typography--h6",
};

// 自定义 Heading 扩展
export const Heading = TiptapHeading.extend({
  // 重写 renderHTML 方法，控制输出的 HTML 结构和类名
  renderHTML({ node, HTMLAttributes }) {
    // 获取当前节点的 level（例如 1、2...）
    const level = node.attrs.level as Levels;

    // 检查 level 是否在允许范围内（this.options.levels 默认是 [1,2,3,4,5,6]）
    // 如果不在，降级到第一个允许的级别（通常是 1）
    const validLevel = this.options.levels.includes(level)
      ? level
      : (this.options.levels[0] as Levels);

    // 构建最终要应用的 class 字符串
    // 这里只用 typography--hX，但你可以根据 node.attrs 动态追加其他类（见下方“扩展建议”）
    const className = headingClasses[validLevel];

    return [
      `h${validLevel}`, // 标签名：h1, h2, ..., h6
      mergeAttributes(
        this.options.HTMLAttributes, // 扩展级别的全局 HTML 属性
        HTMLAttributes, // 节点级别的额外 HTML 属性
        { class: className } // 注入我们的 typography 类
      ),
      0, // 子内容占位符（Tiptap 自动填充标题文字）
    ];
  },
})
  // 可选：配置默认选项（例如限制可用的标题级别）
  .configure({
    // 例如只允许 h1 ~ h3：
    // levels: [1, 2, 3],
  });

export default Heading;
