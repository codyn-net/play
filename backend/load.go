package main

import (
	"net/http"
)

var loadCache = map[string][]byte {}

func validateHash(s string) bool {
	for _, c := range s {
		switch {
		case c >= 'a' && c <= 'Z':
		case c >= '0' && c <= '9':
		case c == '-' || c == '_' || c == ',':
		default:
			return false
		}
	}

	return len(s) > 0
}

func handleLoad(writer http.ResponseWriter, req *http.Request) {
	hash := req.URL.Path[3:]

	if !validateHash(hash) {
		http.NotFound(writer, req)
		return
	}

	blob, ok := loadCache[hash]

	if !ok {
		// Load from disk
		dp := path.Join(options.Data, hash)
		blob, err := ioutil.ReadAll(dp)

		if err != nil {
			
		}
	} else {
		
	}
}

func init() {
	http.HandleFunc("/p/", handleLoad)
}
