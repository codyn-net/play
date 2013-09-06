package main

import (
	"bytes"
	"container/list"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"os"
	"path"
	"strings"
	"sync"
	"time"
)

const DefaultDocument = `# New, empty codyn file

node "a" {
    x = "2 * pi"
}`

type Document struct {
	Data       []byte
	AccessTime time.Time
	Element    *list.Element
}

type DocumentCache struct {
	HashToDocument map[string]Document
	MaxSizeInBytes int
	SizeInBytes    int
	Documents      *list.List

	mutex sync.RWMutex
}

type DocumentHandler struct {
	RestishVoid
}

var Cache = DocumentCache{
	HashToDocument: map[string]Document{},
	Documents: list.New(),
	MaxSizeInBytes: 10 * 1024 * 1024,
}

func (x *DocumentCache) Evict(expected int) {
	for x.SizeInBytes+expected > x.MaxSizeInBytes && x.Documents.Len() > 0 {
		hash := x.Documents.Remove(x.Documents.Front()).(string)
		doc := x.HashToDocument[hash]

		x.SizeInBytes -= len(doc.Data)
		delete(x.HashToDocument, hash)
	}
}

func (x *DocumentCache) AddLocked(hash string, data []byte) {
	// Ignore if already cached
	if _, ok := x.HashToDocument[hash]; ok {
		return
	}

	x.Evict(len(data))

	x.HashToDocument[hash] = Document{
		Data:       data,
		AccessTime: time.Now(),
		Element:    x.Documents.PushBack(hash),
	}

	x.SizeInBytes += len(data)
}

func (x *DocumentCache) Add(hash string, data []byte) {
	x.mutex.Lock()
	defer x.mutex.Unlock()

	x.AddLocked(hash, data)
}

func (x *DocumentCache) Get(hash string) ([]byte, bool) {
	x.mutex.RLock()
	defer x.mutex.RUnlock()

	if doc, ok := x.HashToDocument[hash]; ok {
		return doc.Data, true
	} else {
		return nil, false
	}
}

func (x *DocumentCache) Read(hash string, locked bool) ([]byte, bool) {
	var v []byte
	var ok bool

	if locked {
		var doc Document
		doc, ok = x.HashToDocument[hash]

		if ok {
			v = doc.Data
		}
	} else {
		v, ok = x.Get(hash)
	}

	if !ok {
		// Load from disk
		dp := path.Join(options.Data, hash)

		f, err := os.Open(dp)

		if err != nil {
			return nil, false
		}

		defer f.Close()

		blob, err := ioutil.ReadAll(f)

		if err != nil {
			return nil, false
		}

		return blob, true
	} else {
		return v, true
	}
}

func (x *DocumentCache) Load(hash string) ([]byte, bool) {
	if v, ok := x.Read(hash, false); ok {
		x.Add(hash, v)
		return v, true
	} else {
		return nil, false
	}
}

func (d *DocumentCache) AddDocument(data []byte) (string, bool) {
	d.mutex.Lock()
	defer d.mutex.Unlock()

	hdata := data

	for {
		h := Hash(hdata)

		if existing, ok := d.Read(h, true); ok {
			if bytes.Equal(existing, data) {
				// Document already exists, just return hash then
				return h, true
			} else {
				// Hash collision, generate new hash by just
				// appending newlines, it doesn't actually
				// matter what kind of data is appended, we just
				// need some new hash
				hdata = append(hdata, '\n')
			}
		} else {
			// Write data to disk
			if err := ioutil.WriteFile(path.Join(options.Data, h), data, os.FileMode(0644)); err != nil {
				return "", false
			}

			// Still insert the original data though
			d.AddLocked(h, data)
			return h, true
		}
	}

	return "", false
}

func (d DocumentHandler) Get(writer http.ResponseWriter, req *http.Request) {
	hash := req.URL.Path[3:]
	var ascdn bool

	if strings.HasSuffix(hash, ".cdn") {
		hash = hash[:len(hash)-4]
		ascdn = true
	}

	var blob []byte

	if len(hash) == 0 {
		blob = []byte(DefaultDocument)
	} else {
		if !ValidHash(hash) {
			http.NotFound(writer, req)
			return
		}

		var ok bool
		blob, ok = Cache.Load(hash)

		if !ok {
			http.NotFound(writer, req)
			return
		}
	}

	if ascdn {
		writer.Header().Add("Content-Type", "text/x-cdn")
		writer.Write(blob)
	} else {
		if blob[len(blob)-1] == '\n' {
			blob = blob[0 : len(blob)-1]
		}

		RunIndex(writer, string(blob))
	}
}

func (d DocumentHandler) Put(writer http.ResponseWriter, req *http.Request) {
	doc := []byte(req.FormValue("document"))

	if len(doc) == 0 {
		http.NotFound(writer, req)
		return
	}

	if doc[len(doc)-1] != '\n' {
		doc = append(doc, '\n')
	}

	if hash, ok := Cache.AddDocument(doc); ok {
		retval := map[string]string{
			"hash": hash,
		}

		writer.Header().Add("Content-Type", "application/json")

		enc := json.NewEncoder(writer)
		enc.Encode(retval)
	} else {
		http.NotFound(writer, req)
	}
}

func init() {
	http.Handle("/d/", NewRestishHandler(DocumentHandler{}))
}
