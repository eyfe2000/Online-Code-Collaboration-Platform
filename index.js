const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { exec } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

// 设置静态文件目录
app.use(express.static('public'));

// 处理与版本控制相关的请求
app.post('/git/:action', (req, res) => {
  const { action } = req.params;

  switch (action) {
    case 'clone':
      // 处理克隆仓库请求
      const { repository, folderName } = req.body;
      cloneRepository(repository, folderName)
        .then(() => res.json({ message: 'Repository cloned successfully' }))
        .catch((error) => res.status(500).json({ message: `Error cloning repository: ${error.message}` }));
      break;
    case 'pull':
      // 处理拉取更新请求
      const { folder } = req.body;
      pullRepository(folder)
        .then(() => res.json({ message: 'Repository pulled successfully' }))
        .catch((error) => res.status(500).json({ message: `Error pulling repository: ${error.message}` }));
      break;
    default:
      res.status(404).json({ message: 'Invalid action' });
  }
});

// 处理与协作相关的请求
io.on('connection', (socket) => {
  console.log('A user connected');

  // 监听来自客户端的代码变更
  socket.on('codeChange', (data) => {
    // 将代码变更广播给所有连接的客户端
    socket.broadcast.emit('codeChange', data);
  });

  // 监听来自客户端的光标位置变更
  socket.on('cursorMove', (data) => {
    // 将光标位置变更广播给所有连接的客户端
    socket.broadcast.emit('cursorMove', data);
  });

  // 监听来自客户端的聊天消息
  socket.on('chatMessage', (data) => {
    // 将聊天消息广播给所有连接的客户端
    io.emit('chatMessage', data);
  });

  // 监听断开连接事件
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// 克隆Git仓库
function cloneRepository(repository, folderName) {
  return new Promise((resolve, reject) => {
    exec(`git clone ${repository} ${folderName}`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr));
      } else {
        resolve();
      }
    });
  });
}

// 拉取Git仓库更新
function pullRepository(folder) {
  return new Promise((resolve, reject) => {
    exec(`cd ${folder} && git pull`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr));
      } else {
        resolve();
      }
    });
  });
}

// 启动Express应用程序
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
