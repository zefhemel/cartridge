DENO_BUNDLE=deno bundle
build: *
	mkdir -p build
	${DENO_BUNDLE} browser_runner.ts build/browser_runner.js
	${DENO_BUNDLE} worker.ts build/worker.js
	${DENO_BUNDLE} serviceworker.ts build/serviceworker.js
	cp *.html *.css build/
	deno run --allow-read --allow-write --unstable bundle.ts --debug test_app/app.json build/app.json
