# Introduce

This protocol is on the tcp layer

Every message has new line(0x0A) as a footer.

The fisrt word of message indicates the type of message.

Last of the message are arguments.

If arguments have new line(0x0A) or space(0x20), they must be escaped.

```
(0x5C) -> (0x5C)(0x2F): \/
(0x0A) -> (0x5C)(0x6E): \n
(0x20) -> (0x5C)(0x73): \s
```

Client must unescape the arguments properly.


# list of message -

ping [hostname] [randomStr] 

pong [randomStr] [clientName] [clientVersion] 

alive [userStatus] 

profile [profileName] [profileInfo] 

message [message] 

filesend [fileID] [fileSize] [fileName] 

fileaccept [fileID] 

fileokay  [fileID] [blockIndex] 

fileerror [fileID] [blockIndex] 

filecancle [fileID] 

filedata [fileID] [blockIndex] [blockHash] [blockData] 