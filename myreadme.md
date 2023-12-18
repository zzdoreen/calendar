+ node v20.10.0
+ yarn 初始化

# List
- [x] [npm run package 打包报错](https://zhuanlan.zhihu.com/p/483976136)

- [x] 应用图标切换
  1. `npm i -S electron-icon-builder`
  2. 修改 `package.json` ,在 `scripts` 添加指令
  ```json
  "scripts":{
    // ...
    "electron:generate-icon": "electron-icon-builder --input=./assets/icon.png --output=assets --flatten"
  }
  ```
  执行指令后会在 `output` 指定的文件夹内生成 `icons` 文件夹,里面生成了尺寸的图标
  然后应该要执行 `npm run rebuild` / `npm run build` 指令、再打包才生效

- [x] 静态文件引用
  在 `App.tsx` 中如果页面需要加载一个图片，图片路径是 `../assets/img.png` ,不能直接获取到
  需要按模块导入的方式，并且需要在 `webpack.config.renderer.dev` 里面配置 `type: 'asset/resource'`  
  
  目前需求是我需要获取 `.proto` 文件,以静态文件的形式获取没成功，后面就改成通过 `loader` 解析
  1. `npm i -D protobufjs-loader`
  2. `webpack.config.renderer.dev` 添加配置
  ```js
    {
        test: /\.proto$/i,
        use: ['protobufjs-loader'],
        exclude: /\.module\.proto$/,
    }
  ```
- [x] [在Windows上打Linux包](https://blog.csdn.net/linzhi12/article/details/119026910)