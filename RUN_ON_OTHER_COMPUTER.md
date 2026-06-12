# 在其他电脑上运行

## 环境要求

- Node.js 18 或更高版本
- Git 可选，不是必须

## Windows 运行步骤

1. 解压这个项目压缩包。
2. 在项目文件夹空白处右键，选择“在终端中打开”或打开 PowerShell 后进入项目目录。
3. 安装依赖：

```powershell
npm.cmd install --legacy-peer-deps
```

4. 启动本地开发服务：

```powershell
npm.cmd run dev
```

5. 浏览器打开：

```text
http://localhost:3000
```

## 如果提示 npm.ps1 被系统禁止

这是 Windows PowerShell 执行策略问题，不需要改系统设置。直接使用 `npm.cmd` 命令即可：

```powershell
npm.cmd install --legacy-peer-deps
npm.cmd run dev
```

## 生产构建检查

如果想确认项目能正常构建：

```powershell
npm.cmd run build
```

## 当前默认语言

默认界面是中文，同时保留：

- `/zh`
- `/en`
- `/es`

