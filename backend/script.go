package main

import (
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
)

type ScriptHandler struct {
	RestishVoid

	Script string
}

func NewScriptHandler(script string) http.Handler {
	return NewRestishHandler(ScriptHandler{
		Script: script,
	})
}

func (d ScriptHandler) run(data io.Reader, writer http.ResponseWriter, req *http.Request) {
	resp, err := http.Post(options.Player+d.Script, "text/x-cdn", data)

	if err != nil {
		fmt.Fprintf(os.Stderr, "Error connecting player: %s\n", err)
		http.Error(writer, fmt.Sprintf("Player service is unavailable: %s", err), http.StatusServiceUnavailable)
	} else {
		if resp.StatusCode != 200 {
			b, _ := ioutil.ReadAll(resp.Body)
			http.Error(writer, string(b), resp.StatusCode)
		} else {
			writer.Header().Add("Content-type", "application/json")
			io.Copy(writer, resp.Body)
		}
	}
}

func (d ScriptHandler) Get(writer http.ResponseWriter, req *http.Request) {
	doc := req.URL.Path[(len(d.Script)+2):]

	if data, ok := Cache.Load(doc); !ok {
		http.Error(writer, fmt.Sprintf("Could not find document `%s'"), http.StatusNotFound)
	} else {
		buf := bytes.NewBuffer(data)
		d.run(buf, writer, req)
	}
}

func (d ScriptHandler) Post(writer http.ResponseWriter, req *http.Request) {
	doc := req.FormValue("document")

	buf := bytes.NewBuffer([]byte(doc))
	d.run(buf, writer, req)
}

func init() {
	commands := []string{"check", "run", "graph"}

	for _, cmd := range commands {
		http.Handle("/"+cmd+"/", NewScriptHandler(cmd))
	}
}
