package main

import (
	"html/template"
	"io"
	playassets "local/assets"
	"net/http"
	"path"
)

var indextempl *template.Template

func RunIndex(writer io.Writer, doc string) {
	if options.Development {
		if len(playassets.Assets.LocalPath) != 0 {
			indextempl.ParseFiles(path.Join(playassets.Assets.LocalPath, "index.html"))
		} else {
			indextempl.Parse(string(playassets.Assets.Files["/index.html"].Data))
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
	indextempl = template.New("index")
	indextempl.Parse(string(playassets.Assets.Files["/index.html"].Data))

	http.HandleFunc("/", handleRoot)
}
