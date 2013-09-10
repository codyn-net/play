package main

import (
	"fmt"
	"html/template"
	"io"
	playassets "local/assets"
	"net/http"
	"os"
	"path"
)

var indextempl *template.Template

func RunIndex(writer io.Writer, doc string) {
	if options.Development {
		var err error

		indextempl = template.New("index.html")

		if len(playassets.Assets.LocalPath) != 0 {
			indextempl, err = indextempl.ParseFiles(path.Join(playassets.Assets.LocalPath, "index.html"))

		} else {
			indextempl, err = indextempl.Parse(string(playassets.Assets.Files["/index.html"].Data))
		}

		if err != nil {
			fmt.Fprintf(os.Stderr, "Failed to parse template: %s\n", err)
		}
	}

	indextempl.Execute(writer, doc)
}

func handleIndex(writer http.ResponseWriter, req *http.Request) {
	RunIndex(writer, DefaultDocument)
}

func handleRoot(writer http.ResponseWriter, req *http.Request) {
	n := path.Clean(req.URL.Path)

	if n == "/" || n == "/index.html" {
		handleIndex(writer, req)
	} else {
		http.FileServer(playassets.Assets).ServeHTTP(writer, req)
	}
}

func init() {
	if !options.Development {
		indextempl = template.New("index.html")
		indextempl.Parse(string(playassets.Assets.Files["/index.html"].Data))
	}

	http.HandleFunc("/", handleRoot)
}
