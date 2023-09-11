.PHONY: codegen
codegen:
	cd autocomplete/extract && npm test

.PHONY: clean
clean:
	cp autocomplete/specs/specs_.go autocomplete/
	rm -r autocomplete/specs
	mkdir autocomplete/specs
	mv autocomplete/specs_.go autocomplete/specs/