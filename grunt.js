module.exports = function( grunt ) {
	'use strict';

	grunt.initConfig({
		pkg: '<json:package.json>',
		meta: {
			banner: '/*!\n' +
				'* <%= pkg.name %>\n' +
				'* v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
				'<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
				'* (c) <%= pkg.author.name %>\n' +
				'* MIT License\n' +
				'*/'
		},
		concat: {
			dist: {
				src: ['<banner:meta.banner>', 'src/<%= pkg.name %>.js'],
				dest: 'dist/<%= pkg.name %>.js'
			}
		},
		min: {
			dist: {
				src: ['<banner:meta.banner>', 'src/<%= pkg.name %>.js'],
				dest: 'dist/<%= pkg.name %>.min.js'
			}
		},
		lint: {
			files: ['grunt.js', 'src/<%= pkg.name %>.js']
		},
		watch: {
			files: '<config:lint.files>',
			tasks: 'default'
		},
		jshint: {
			options: {
				es5: true,
				esnext: true,
				bitwise: true,
				curly: true,
				eqeqeq: true,
				newcap: true,
				noarg: true,
				noempty: true,
				regexp: true,
				undef: true,
				strict: true,
				trailing: true,
				smarttabs: true,
				browser: true,
				nonstandard: true,
				expr: true
			}
		}
	});

	grunt.registerTask('default', 'lint');
	grunt.registerTask('release', 'concat min');

};