# Why is this needed?
When launch a electron app, there are two node process.
One is on the main, the other is on the renderer.

The main part is responsible for core functions such as networking, file I/O.
While, the renderer part is responsible for displaying information.

So, information must be sent between these two processes via IPC.

## Req/Res

bootInfoReq
bootInfoRes { progress, logs }

## Event

bootSucc
bootFail

newUser { address }

userConnect { address }
userDisconnect { address }

userAlive { address, status }
userProfile { address, name, info }
userClient { address, name, version }

userMessage { address, message, options }

userFileAccept { address, fileType, fileID }
userFileFinished { address, fileType, fileID }
userFileError { address, fileType, fileID }
userFileCancle { address, fileType, fileID }
userFileData { address, fileType, fileID, dataSize, accumSize }

## Actions

addFriend { address }
sendMessage { address, message }