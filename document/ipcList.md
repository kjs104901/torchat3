# Why is this needed?
When launch a electron app, there are two node process.
One is on the main, the other is on the renderer.

The main part is responsible for core functions such as networking, file I/O.
While, the renderer part is responsible for displaying information.

Therefore, information must be sent between these two processes via IPC.

## Req/Res

bootInfoReq
bootInfoRes { progress, logs }

contactReq
contactRes { friendList, blackList, whiteList }

settingReq
settingRes { setttings... }

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
- { message, options: { fromMe, fileID, fileSize }}
- { message, options: { fromMe } }

userFileAccept { address, fileID }
userFileFinished { address, fileID }
userFileError { address, fileID }
userFileCancel { address, fileID }
userFileData { address, fileID, accumSize }
userFileSpeed { address, fileID, speed }

## Actions

sendMessage { address, message }
sendFile { address }
sendFilePath { address, path }
acceptFile { address, fileID }
cancelFile { address, fileID }

saveSetting { settings... }
saveContact { friendList, blackList, whiteList }