# Req/Res

bootInfoReq
bootInfoRes { progress, logs }

# Event

bootSucc
bootFail

userListUpdate { data }

userConnect { address }
userClose { address }
userAlive { address, status }
userProfile { address }
userMessage { address, message, options }
userFileaccept { address, fileID }
userFileupdate { address, fileID }

# Actions

addFriend { address }