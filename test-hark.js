// Hark 最小测试脚本
function main() {
  var size = $widget.size;
  $widget.setConfig({
    type: "stack",
    direction: "column",
    flex: 1,
    padding: [12, 12, 12, 12],
    borderRadius: 22,
    background: { light: { type: "linear", colors: ["#F6F1E8", "#EADFC9"] }, dark: { type: "linear", colors: ["#2A2A2C", "#17171A"] } },
    children: [
      { type: "text", text: "测试成功 " + size, font: { size: 17, weight: "bold" }, color: { light: "#2B2118", dark: "#F5EFE4" } },
      { type: "text", text: "如果看到这行，脚本模式工作正常", font: { size: 12 }, color: { light: "#8A7B63", dark: "#9A8C78" } }
    ]
  });
}
try { main(); } catch (e) {
  $widget.setConfig({ type: "stack", children: [{ type: "text", text: "报错:" + e.message, font: { size: 13 }, color: "#FF0000" }] });
}
