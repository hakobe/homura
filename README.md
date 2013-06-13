# homura

This is the IRC bouncer written in JavaScript for Node.js. 

The name "homura" is from [madoka](http://www.madoka.org/) which is the IRC bouncer I used first ;)

## Synopsis

```
$ mkdir hom
$ cd hom
$ npm install -g homura
$ vim config.json // see Configuration section
$ homura -v
```

To use homura, please connect to `host:port` configured in `config.json` from your IRC client.
You should set the IRC user name like `USERNAME@NETWORKNAME`. (e.g. `akemi@freenode` or `akemi@ircnet` )

`USERNAME` is an actual user name for IRC networks, 
and `NETWORKNAME` is a name that homura uses to decide which IRC network connect to.


## Install

```
$ npm install -g homura
```

## Configuration

Homura uses a JSON format configuration file.

The default path of the configuration file is `config.json` of current directry 
that homur is running on, and you can also specify `config.json` by using 
`--config` option.

```
$ homura --config /path/to/your_config.json
```

`config.json` defines options below:

- `host` (required) : Host the client should connect to homura
- `port` (required) : Port the client should connect to homura
- `password` (optional) : Password that is required to connect to homura
- `tls` (optional) : With this option, the client has to connect to homura using TLS. The passed Object 
                     should be used for `tls.createServer` options directry.
                     For `key`, `cert`, `ca` and `pfx` options, you can pass the file path by appending
                    `_file` to the option name like `key_path`.
- `networks` (required) : An Array of IRC network settings you connect to.
    - `name` (required) : name to identify network. You can connect this network with `USERNAME@{name}`
    - `host` (required) : IRC server host
    - `port` (required) : IRC server port
    - `nick` (required) : IRC nick
    - `user` (optional) : IRC user. Default is the same as the nick
    - `real` (optional) : IRC real name. Default is the same as the nick
    - `encoding` (optional) : The character encoding used on this IRC network. Default is `UTF-8`
    - `tls` (optional) : With this option, homura makes the connection to IRC network using TLS.
                         The passed Object should be used for `tls.connect` options directry.
                         For `key`, `cert`, `ca` and `pfx` options, you can pass the file path by appending
                         `_file` to the option name like `key_path`.



### config.json (sample)
```javascript
{
    "host" : "localhost",
    "port" : 6667,
    "password" : "YOURPASSWORD",
    "tls" : {
        "key_file"  : "/absolute/path/to/your/privatekey.pem",
        "cert_file" : "/absolute/path/to/your/cetificate.pem",
        // and you can put tls.createServer options here.
    },
    "networks" : [ // IRC network settings you want to connect to.
        {
            "name"     : "freenode",
            "host"     : "hubbard.freenode.net",
            "port"     : 7000,
            "nick"     : "YOURNICK",
            "user"     : "YOURUSER",
            "real"     : "YOURNAME",
            "encoding" : "UTF-8",
            "tls"      : {
              "ca_file"  : "/absolute/path/to/your/ca.pem",
              // and you can put tls.connect options here.
              //
              // You have to set empty Object here now
              // even if you would not have to pass any options to tls.connect.
            }
        },
        {
            "name"     : "ircnet",
            "encoding" : "ISO-2022-JP",
            "server"   : "irc.media.kyoto-u.ac.jp",
            "port"     : 6667,
            "nick"     : "YOURNICK",
            "user"     : "YOURUSER",
            "real"     : "YOURNAME",
        }
    ]
}
```

## Run

Start the homura with `config.json` in current directory.
```
$ homura
```

or specify `config.json` by `--config` option.
```
$ homura --config /path/to/your_config.json
```

Please specify `-v` or `--verbose` options to see what the homura is doing.
`--debug` may be too noisy (prints the same IRC messages 4 times...) .
```
$ homura -v
$ homura --debug
```

## Modules

### Log

### AutoJoin

## Todos
- CTCP message handling
- AWAY message handling
- More plugins
- NickServe Support

## Author
- @hakobe

## License

Licensed under the MIT License
