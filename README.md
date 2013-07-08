[![Build Status](https://travis-ci.org/hakobe/homura.png?branch=master)](https://travis-ci.org/hakobe/homura)

# homura

This is a IRC bouncer written in JavaScript for Node.js. The name "homura" is from [madoka](http://www.madoka.org/) which is the IRC bouncer I used first ;)

This project is under *DEVELOPMENT*. APIs are unstable and some important features have not been implemented yet.

## Synopsis

```
$ npm install -g homura
$ vim config.json // see Configuration section
$ homura -v
```

To connect to homura with your IRC client, use the host and the port configured in `config.json`.
You should set the IRC user name like `USERNAME@BOUNCERNAME`. (e.g. `akemi@freenode` or `akemi@ircnet` )

`USERNAME` is an actual user name for IRC networks, 
and `BOUNCERNAME` is a name that homura uses to decide which IRC network connect to.


## Install

```
$ npm install -g homura
```

## Configuration

homura uses a JSON format configuration file.

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
- `bouncers` (required) : An Array of IRC bouncer settings.
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
    "bouncers" : [
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
    ],
    "modules" : [
        {
            "name" : "log",
            "dir"  : "/path/to/logs"
        },
        {
            "name" : "auto-join",
            "channels" : {
                "freenode" : [ "#autojoinchan1", "#autojoinchan2" ],
                "ircnet"   : [ "#autojoinchan3" ]
            }
        },
        {
            "name" : "auto-reply"
        },
        {
            "name" : "log-buffer",
            "size" : 100
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

Modules are placed under `modules` directory. You can enable modules and can pass options to modules in `config.json`. Please see Configuration section.

### log 
Writes logs to files.

#### Options
- dir : Directory to save logfiles in
- format : Format of the log filename (e.g. `{bouncer}-{channel}-{year}{month}{date}.log` )

### auto-join
Joins to channels specified when homura has connected to network.

#### Options
- channels : Object that each network-name-key has Array of channel name to join automatically.

### auto-reply
Replies a message automatically while you are not connected to homura.

#### Options
- message : Message to use for reply

### log-buffer
Buffres conversation logs for each target (channerl or user), and sends them as notice of the server when you connect to homura.

#### Options
- size : Buffer size of logs

## Todos
- More tests
- More documents for hacking

## Author
- @hakobe

## License

Licensed under the MIT License
