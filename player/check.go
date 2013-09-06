package main

import (
	"net/http"
)

func handleCheck(writer http.ResponseWriter, req *http.Request) {
	// Spawn python checker
	writer.Header().Add("Content-type", "application/json")

	if err := RunScript(req.Body, writer, "check"); err != nil {
		http.NotFound(writer, req)
	}
}

func init() {
	http.HandleFunc("/check", handleCheck)
}
