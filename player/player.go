package main

import (
	"fmt"
	"github.com/jessevdk/go-flags"
	"net/http"
	"os"
)

type Options struct {
	Listen      string `short:"l" long:"listen" description:"The address to listen on" default:":4785"`
	Python      string `short:"p" long:"python" description:"The python interpreter to use" default:"python"`
	Development bool   `long:"dev" description:"Enable development mode"`
}

var options Options

func main() {
	if _, err := flags.Parse(&options); err != nil {
		os.Exit(1)
	}

	fmt.Printf("[player] Going to listen on %s\n", options.Listen)
	http.ListenAndServe(options.Listen, nil)
}
