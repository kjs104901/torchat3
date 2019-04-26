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
userFileAccept { address, fileID }
userFileUpdate { address, fileID }

# Actions

addFriend { address }
sendMessage { address, message }