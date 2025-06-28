# WeChat DevTool

快速打开和管理微信小程序项目，支持多设备配置和图形化设置界面。

## 功能特性

- 🚀 **快速打开项目** - 通过微信开发者工具 CLI 快速打开配置的小程序项目
- 🖥️ **多设备支持** - 支持多台设备独立配置，自动检测当前设备
- ⚙️ **图形化配置** - 完全图形化的配置界面，支持动态添加设备和项目
- 🔍 **智能搜索** - 支持按项目名称和路径搜索
- 📱 **设备回退** - 当设备未配置时，可选择使用默认设备配置或显示错误
- 🔔 **操作反馈** - 可配置的操作成功/失败通知

## 安装

1. 在 Raycast 中搜索 "WeChat DevTool"
2. 点击安装扩展
3. 使用 "Configure Extension" 命令进行初始配置

## 配置说明

### 偏好设置

在 Raycast 偏好设置中可以配置以下选项：

- **显示通知** - 是否显示操作成功/失败的通知
- **默认回退设备** - 当当前设备未配置时的处理方式：
  - 使用默认设备：使用 `__default__` 设备的配置
  - 显示错误：显示配置错误提示

### 图形化配置

使用 "Configure Extension" 命令打开配置界面：

1. **设备管理**
   - 设备名称：默认为当前设备名（通过 `scutil --get ComputerName` 获取）
   - CLI 路径：微信开发者工具 CLI 可执行文件路径，默认为 `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`

2. **项目管理**
   - 项目名称：显示名称
   - 项目路径：小程序项目的完整路径
   - 项目 ID：自动生成的唯一标识符

3. **操作功能**
   - 添加设备：创建新的设备配置
   - 添加项目：为当前设备添加新项目
   - 编辑配置：修改设备或项目信息
   - 删除配置：移除设备或项目

## 使用方法

### 打开项目

1. 使用 "Open Mini Program Project" 命令
2. 在列表中找到要打开的项目
3. 点击项目或使用快捷键打开

### 搜索项目

- 在项目列表中直接输入项目名称或路径进行搜索
- 支持模糊匹配

### 项目操作

- **打开项目** - 使用微信开发者工具打开项目
- **复制路径** - 复制项目路径到剪贴板
- **在访达中显示** - 在 Finder 中显示项目文件夹

## 配置存储

配置信息存储在本地 JSON 文件中：

- 位置：`~/.config/raycast-weapp.json`
- 格式：JSON 格式，包含所有设备和项目配置

## 设备检测

扩展会自动检测当前设备名称：

- 使用 `scutil --get ComputerName` 命令获取设备名
- 如果检测失败，使用 "Unknown Device" 作为设备名

## 故障排除

### 常见问题

1. **设备未配置**
   - 使用 "Configure Extension" 命令添加当前设备配置
   - 或在偏好设置中选择使用默认设备

2. **CLI 路径错误**
   - 确认微信开发者工具已安装
   - 检查 CLI 路径是否正确
   - 默认路径：`/Applications/wechatwebdevtools.app/Contents/MacOS/cli`

3. **项目打开失败**
   - 检查项目路径是否存在
   - 确认微信开发者工具 CLI 权限
   - 查看错误信息进行针对性解决

### 日志查看

在 Raycast 开发者工具中查看控制台日志，获取详细的错误信息。

## 开发

### 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd wechat-devtool

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 代码检查
npm run lint
```

### 项目结构

```
src/
├── configure.tsx      # 配置界面组件
├── open-project.tsx   # 主命令组件
├── types.ts          # 类型定义
└── utils/
    ├── cli.ts        # CLI 执行工具
    ├── config.ts     # 配置管理工具
    └── preferences.ts # 偏好设置工具
```

## 许可证

MIT License
