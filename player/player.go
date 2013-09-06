package main

import (
	"github.com/jessevdk/go-flags"
	"net/http"
	"os"
)

type Options struct {
	Listen string `short:"l" long:"listen" description:"The address to listen on" default:":4785"`
}

var options Options

const DevelopmentMode = true

func main() {
	if _, err := flags.Parse(&options); err != nil {
		os.Exit(1)
	}

	http.ListenAndServe(options.Listen, nil)
}
