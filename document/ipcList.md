# Req/Res

bootInfoReq
bootInfoRes { progress, logs }

# Event

bootSucc
bootFail

newUser { address }

userConnect { address }
userClose { address }

userAlive { address, status }
userProfile { address, name, info }
userClient { address, name, version }

userMessage { address, message, options }

userFileAccept { address, fileType, fileID }
userFileFinished { address, fileType, fileID }
userFileError { address, fileType, fileID }
userFileCancle { address, fileType, fileID }
userFileData { address, fileType, fileID, dataSize, accumSize }



# Actions

addFriend { address }
sendMessage { address, message }