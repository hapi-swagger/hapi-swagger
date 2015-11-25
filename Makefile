

test:
	./node_modules/mocha/bin/mocha --reporter list
test-cov:
	node ./node_modules/istanbul/lib/cli.js cover ./node_modules/mocha/bin/_mocha test/*.js --report html -- -R spec

.PHONY: test

 