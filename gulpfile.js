/* ----------- Dependencies ------------*/

const gulp = require("gulp"),
	pump          = require("pump"),
	del           = require("del"),
	rename        = require("gulp-rename"),
	sourcemaps    = require("gulp-sourcemaps"),
	filter        = require("gulp-filter"),
	zip           = require("gulp-zip"),
	browsersync   = require("browser-sync").create(),
	htmlmin       = require("gulp-htmlmin"),
	w3cjs         = require("gulp-w3cjs"),
	stylelint     = require("gulp-stylelint"),
	imagemin      = require("gulp-imagemin"),
	concat        = require("gulp-concat"),
	uglifyjs      = require("uglify-es"),
	composer      = require("gulp-uglify/composer"),
	minify        = composer(uglifyjs, console),
	eslint        = require("gulp-eslint"),
	pngcrush      = require("imagemin-pngcrush"),
	postcss       = require("gulp-postcss"),
	autoprefixer  = require("autoprefixer"),
	sorter        = require("css-declaration-sorter"),
	nano          = require("cssnano"),
	// cssvar        = require("postcss-css-variables"),
	colorMod      = require("postcss-color-mod-function"),
	customProp    = require("postcss-custom-properties"),
	mixins        = require("postcss-mixins"),
	calc          = require("postcss-calc"),
	util          = require("postcss-utilities"),
	nested        = require("postcss-nested"),
	nestedProps   = require("postcss-nested-props"),
	uncss         = require("postcss-uncss"),
	willchange    = require("postcss-will-change"),
	focus         = require("postcss-focus"),
	custommedia   = require("postcss-custom-media"),
	atImport      = require("postcss-import"),
	urlrev        = require("postcss-urlrev"),
	extend        = require("postcss-extend"),
	inlinesvg     = require("postcss-inline-svg"),

	cssPseudos    = require("postcss-pseudoelements"),
	fontVariant   = require("postcss-font-variant"),

// Not really necessary stuff, but doesn't hurts
	anylinkPseudo = require("postcss-pseudo-class-any-link"),
	overflowWrap  = require("postcss-replace-overflow-wrap"),

// PostHTML
	posthtml      = require("gulp-posthtml");

// Wishlist
//
// postcss-css-mix
// postcss-aspect-ratio
// postcss-currency
// postcss-round-subpixels (may have a problem with hairline border)
// postcss-inline-comments
// postcss-brand-colors
//

/*-----Paths-&-Variables----*/

var path = {
	src: "src",
	html: "src/html",
	css: "src/css",
	js: "src/js",
	img: "src/img",
	font: "src/font",
	jekyll: "src/jekyll"
};
var outputDir = "dist";

var cssOutputOrig = [outputDir + "/*.css", "!"+outputDir+"/*.min.css"];
var htmlOutputOrig = [outputDir + "/*.html", "!"+outputDir+"/*.min.html"];
// var htmlOutputOrig = [HTMLoutputDir + "**/*.html"];
// var jsOutputOrig = [outputDir + "/*.js", "!"+outputDir+"/*.min.js"];

var watched = {
	// css: path.css + "/**/*.css",
	css: path.css + "/style.css",

	// html: path.html + "/index.html",
	// html: HTMLoutputDir + "/index.html",
	html: path.html + "/**/*.html",
	// img: [path.img + "/**/*", "!" + path.img + "/sprite/*"], except sprite material
	// js: path.js + "/**/*.js",
	// js: [path.js + "/**/*.js", "!node_modules/**", "!feather.js"],
	// js = {vendor: path.js + "/vendor/*.js", main: path.js + "/main.js"},
	jsVendor: path.js + "/vendor/*.js",
	jsMain: [path.js + "/**/*.js", "!" + path.js + "/vendor/*.js" ],

	img: path.img + "/**/*",
	font: path.font + "/**/*",
	all: path.src + "/**/*.*",
	jekyll: path.jekyll + "/**/*"
};
// var renameJSFunction = function (pathjs) {
// 	pathjs.extname = ".min.js";
// 	return pathjs;
// };

var renameCSSFunction = function (pathcss) {
	pathcss.extname = ".min.css";
	return pathcss;
};
// var renameHTMLFunction = function (pathhtml) {
// 	pathhtml.extname = ".min.html";
// 	return pathhtml;
// };


/*-----Tasks----------------*/

/*--CSS Tasks--*/
function styles () {
	let processors = [
		atImport({ from: watched.css }),
		willchange,
		autoprefixer,
		mixins,
		customProp({ strict: false, preserve: true }),
		calc({mediaQueries: true,selectors: true}),
		// nesting
		nested,
		custommedia,
		colorMod,
		focus,
		extend,
		urlrev({relativePath: "src/"}),
		util,
		inlinesvg,

		cssPseudos,
		fontVariant,
		anylinkPseudo,
		overflowWrap({method: "copy"})

		// uncss({ html: [outputDir + "/*.html"], ignore: [".fade"] })

		// worst case scenario >> uncss({ html: [outputDir + "**/*.html"], ignore: [".fade"] })
	];
	return gulp.src(watched.css)
		.pipe(postcss(processors))
		.pipe(gulp.dest(outputDir));
}

function sortCSS() {
	return gulp.src(cssOutputOrig)
		.pipe(postcss([ sorter({order: "alphabetically"})]));
}

function lintCSS(){
	return gulp.src(cssOutputOrig)
		.pipe(stylelint({
			failAfterError: true,
			reportOutputDir: "reports/stylelint",
			reporters: [
				{formatter: "verbose", console: true},
				{formatter: "json", save: "report.json"}
			],
			debug: true
		}));
}

function renameCSS() {
	return gulp.src(cssOutputOrig)
		.pipe(rename(renameCSSFunction))
		.pipe(gulp.dest(outputDir));
}


function sourcemap() {
	return gulp.src(cssOutputOrig)
		.pipe(sourcemaps.init())
		.pipe(sourcemaps.write("map/"))
		// .pipe(sourcemaps.write("map/", {
		//   sourceMappingURLPrefix: "https://www.mydomain.com/"
		// }))
		.pipe(gulp.dest(outputDir));
}

function minifyCSS() {
	return gulp.src(outputDir + "/*.min.css")
		.pipe(postcss([ nano({ autoprefixer: false })]))
		.pipe(gulp.dest(outputDir));
}

/*--HTML Tasks --*/

/*--First Scenario--*/
// gulp.task("texts", function(){
// 	return gulp.src(watched.html)
// 		.pipe(posthtml([
// 			/* Text Plugins */
// 			require("posthtml-lorem")(),
// 			require("posthtml-md")(),
// 			/* DOM Plugins */
// 			require("posthtml-alt-always")(),
// 			require("posthtml-expressions")({ locals: { theMessage: "This is a message from gulpfile.js" }}),
// 			require("posthtml-include")(),
// 			require("posthtml-cache")()
// 		]))
// 		// .pipe(rename(renameHTMLFunction))
// 		.pipe(htmlmin({collapseWhitespace: true}))
// 		.pipe(gulp.dest(outputDir));
// });
// gulp.task("w3c", ["texts"], function () {
// 	return gulp.src(htmlOutputOrig)
// 		.pipe(w3cjs())
// 		.pipe(w3cjs.reporter());
// });
function texts() {
	return gulp.src(watched.html)
		.pipe(posthtml([
			require("posthtml-include")({ root: path.html }),
			require("posthtml-lorem")(),
			require("posthtml-md")(),
			require("posthtml-alt-always")(),
			require("posthtml-expressions")({ locals: { theMessage: "This is a message from gulpfile.js" }})
		]))
		// .pipe(rename(renameHTMLFunction))
		.pipe(htmlmin({collapseWhitespace: true, minifyCSS: true, minifyJS: true, removeComments: true}))
		.pipe(gulp.dest(outputDir));
}

function w3c() {
	return gulp.src(htmlOutputOrig)
		.pipe(w3cjs())
		.pipe(w3cjs.reporter());
}

/*--JavaScript Tasks--*/
function lintJS() {
	pump([
		gulp.src(watched.jsMain),
		eslint({
			rules: {"camelcase":1,"comma-dangle":2,"quotes":0},
			// envs: ["browser],
			globals: ["jQuery","$"]
		}),
		eslint.result(result => {
			// Called for each ESLint result.
			console.log(`ESLint result: ${result.filePath}`);
			console.log(`# Messages: ${result.messages.length}`);
			console.log(`# Warnings: ${result.warningCount}`);
			console.log(`# Errors: ${result.errorCount}`);
		})
	]);
}

// function concatVendor() {
// 	pump([
// 		gulp.src(watched.jsVendor),
// 		concat("vendor.js"),
// 		gulp.dest(outputDir),
// 	]);
// }
function concatVendor() {
	return gulp.src(watched.jsVendor)
		.pipe(concat("vendor.js"))
		.pipe(gulp.dest(outputDir))
}

function concatJS(cb) {
	var options = {};
	pump([
		gulp.src(watched.jsMain),
		sourcemaps.init(),
		concat("script.js"),
		gulp.dest(outputDir),
		rename("script.min.js"),
		minify(options),
		sourcemaps.write("map/"),
		gulp.dest(outputDir)
	],
	cb
	);
}
// function concatJS() {
// 	return gulp.src(watched.jsMain)
// 		.pipe(sourcemaps.init())
// 		.pipe(concat("script.js")),

// 	gulp.dest(outputDir)
// 		.pipe(rename("script.min.js"))
// 		// minify().on("error", function(err) {
// 		// 	gutil.log(gutil.colors.red("[Error]"), err.toString());
// 		// 	// this.emit("end");
// 		// }),
// 		.pipe(minify())
// 		.pipe(sourcemaps.write("map/")),
// 	gulp.dest(outputDir);
// }

// BrowserSync
function broSync() {
	browsersync.init({
		server: {
			baseDir: outputDir
		},
		port: 3000
	});
}
// BrowserSync Reload
function broSyncReload() {
	browsersync.reload();
}

// gulp.task("renameHTML", gulp.series(w3c), function () {
// 	return gulp.src(htmlOutputOrig)
// 		.pipe(rename(renameHTMLFunction))
// 		.pipe(gulp.dest(outputDir));
// });

/*-----Task Groups----------*/

gulp.task("css", gulp.series(styles, lintCSS, renameCSS, sourcemap, minifyCSS), function() {
	browsersync.stream();
});
// gulp.task("html", gulp.series("texts", "w3c, function() {
gulp.task("html", gulp.series(texts), function() {
	browsersync.stream();
});

gulp.task("js", gulp.series(concatVendor, concatJS), function() {
	browsersync.stream();
});


/*-----Production & Independent Tasks-----*/

function img() {
	return gulp.src(watched.img)
		.pipe(imagemin([
			imagemin.svgo({
				plugins: [
					{cleanupIDs: false}
				]
			})
		]))
		.pipe(gulp.dest(outputDir + "/img"));
}

function font() {
	return gulp.src(watched.font)
		.pipe(gulp.dest(outputDir + "/font"));
}

function clear() {
	return del([outputDir]);
}
function zipIt() {
	return gulp.src(outputDir + "/**/*")
		.pipe(zip("dist.zip"))
		.pipe(gulp.dest("."));
}

exports.clear = clear;
exports.zipIt = zipIt;

const build = gulp.series(clear, gulp.parallel("css", "html", "js"), img, font);
const compress = gulp.series(build, zipIt)


gulp.task("jekyll", gulp.series(build), function () {
	return gulp.src(watched.jekyll)
		.pipe(gulp.dest("jekyll-build")),
	// Copy CSS & JS,
	gulp.src([
		outputDir + "/*.min.css",
		outputDir + "/*.min.js",
		outputDir + "/vendor.js",
		// outputDir + "/img",
	])
		.pipe(gulp.dest("jekyll-build/assets/")),

	// Copy image assets except fillers,
	gulp.src([outputDir + "/img/**", "!"+outputDir+"/img/filler/**"])
		.pipe(gulp.dest("jekyll-build/assets/img/")),

	// Copy fonts,
	gulp.src(outputDir + "/font/**")
		.pipe(gulp.dest("jekyll-build/assets/font/"));
});

// function fetchClass() {
// 	return gulp.src(PATHTOSOURCE)
// 	.pipe(posthtml([
//		require("posthtml-classes")()({
// 		    fileSave: true,
// 		    filePath: "classList.css",
// 		    overwrite: false,
// 		    eol: "\n",
// 		    nested: false
// 		})
//     ]));
// }

/* ----------- Export Tasks ------------*/



/*-----Watch----------------*/

function watchFiles() {
	gulp.watch(path.css + "/**/*.css", gulp.series("css")).on("change", function(e) {
		console.log("File " + e.path + " was " + e.type + ", running tasks...");
	});
	gulp.watch(path.src + "/**/*.html", gulp.series("html")).on("change", function(e) {
		console.log("File " + e.path + " was " + e.type + ", running tasks...");
	});
	gulp.watch(path.js + "/**/*.js", gulp.series("js")).on("change", function(e) {
		console.log("File " + e.path + " was " + e.type + ", running tasks...");
	});
	// gulp.watch(watched.html, ["js"]).on("change", function(e) {
	// 	console.log("File " + e.path + " was " + e.type + ", running tasks...");
	// });
	gulp.watch(watched.all).on("change", broSyncReload);
}

const watch = gulp.parallel(watchFiles, broSync);

exports.watch = watch;
exports.default = watch;
exports.img = img;
exports.build = build;
exports.font = font;
