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

ping [hostname] [randomStr](0x0A)

pong [randomStr] [clientName] [clientVersion](0x0A)


alive [userStatus](0x0A)


profile [profileName] [profileInfo](0x0A)


message [message](0x0A)


filesend [fileID] [fileSize] [fileName](0x0A)

fileaccept [fileID](0x0A)

fileokay  [fileID] [blockIndex](0x0A)

fileerror [fileID] [blockIndex](0x0A)

filecancle [fileID](0x0A)

filedata [fileID] [blockIndex] [blockHash] [blockData](0x0A)