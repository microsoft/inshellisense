.PHONY: codegen
codegen:
	cd autocomplete/extract && npm test
	python autocomplete/extract/tools/scrapers/azure.py 

.PHONY: clean
clean:
	cp autocomplete/specs/specs_.go autocomplete/
	rm -r autocomplete/specs
	mkdir autocomplete/specs
	mv autocomplete/specs_.go autocomplete/specs/

.PHONY: build
build:
	go build -o clac main.go

.PHONY: snapshot
snapshot:
	UPDATE_SNAPSHOTS=true go test ./...

.PHONY: test
test:
	go test ./...