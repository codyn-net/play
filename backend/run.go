package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
)

type RunHandler struct {
	RestishVoid
}

func (d RunHandler) run(data io.Reader, writer http.ResponseWriter, req *http.Request) {
	resp, err := http.Post(options.Player+"run", "text/x-cdn", data)

	if err != nil {
		fmt.Fprintf(os.Stderr, "Error connecting player: %s\n", err)
		http.NotFound(writer, req)
	} else {
		if resp.StatusCode != 200 {
			http.NotFound(writer, req)
		} else {
			writer.Header().Add("Content-type", "application/json")
			io.Copy(writer, resp.Body)
		}
	}
}

func (d RunHandler) Get(writer http.ResponseWriter, req *http.Request) {
	doc := req.URL.Path[5:]

	if data, ok := Cache.Load(doc); !ok {
		http.NotFound(writer, req)
	} else {
		buf := bytes.NewBuffer(data)
		d.run(buf, writer, req)
	}
}

func (d RunHandler) Post(writer http.ResponseWriter, req *http.Request) {
	doc := req.FormValue("document")

	buf := bytes.NewBuffer([]byte(doc))
	d.run(buf, writer, req)
}

func init() {
	http.Handle("/run/", NewRestishHandler(RunHandler{}))
}
