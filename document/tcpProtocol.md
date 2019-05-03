# Introduce



# Message

The message is on the tcp layer

Every message has new line(0x0A) as a footer.

The fisrt word of message indicates the type of message.

Last of the message are arguments.

If arguments have posiblity of having new line(0x0A) or space(0x20),
they must be escaped.

```
(0x5C) -> (0x5C)(0x2F): \/
(0x0A) -> (0x5C)(0x6E): \n
(0x20) -> (0x5C)(0x73): \s
```

Client must unescape the arguments properly.


# protocol of message

```
ping [publicKeyStr(base64)] [cookie] [signedStr(base64)]
- signedStr is signed "publicKeyStr"+"cookie" by secretKey(ed25519-v3)
pong [cookieOppsite] [clientName] [clientVersion]
- cookieOppsite is the cookie came from the other side user.

alive [userStatus] 
profile [profileName] [profileInfo] 

message [message] 

filesend [fileID] [fileSize] [fileName] 
fileaccept [fileID] 
fileokay  [fileID] [blockIndex] 
fileerror [fileID] [blockIndex] 
filecancel [fileID] 
filedata [fileID] [blockIndex] [blockHash] [blockData]
```