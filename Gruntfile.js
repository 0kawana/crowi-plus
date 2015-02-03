/*
 * @package RMW
 */

module.exports = function(grunt) {

  var paths = {
        scripts: ['Gruntfile.js', 'app.js', 'lib/**/*.js', 'models/**/*.js', 'routes/**/*.js', 'form/**/*.js', 'resource/js/**/*.js'],
        styles: ['resource/css/*.scss'],
        all: []
      };

  Object.keys(paths).forEach(function(name) {
    paths[name].forEach(function(path) {
      paths.all[paths.all.length] = path;
    });
  });

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    dirs: {
      js: 'resource/js',
      jsDest: 'public/js',
      css: 'resource/css',
      cssDest: 'public/css',
      web: 'public/'
    },
    sass: {
      dev: {
        options: {
          outputStyle: 'nested',
          includePaths: [
            'bower_components/bootstrap-sass-official/assets/stylesheets',
            'bower_components/fontawesome/scss',
            'bower_components/reveal.js/css'
          ]
        },
        files: {
          '<%= dirs.cssDest %>/<%= pkg.name %>.css': '<%= dirs.css %>/<%= pkg.name %>.scss',
          '<%= dirs.cssDest %>/<%= pkg.name %>-reveal.css': '<%= dirs.css %>/<%= pkg.name %>-reveal.scss'
        }
      },
      default: {
        options: {
          outputStyle: 'compressed',
          includePaths: [
            'bower_components/bootstrap-sass-official/assets/stylesheets',
            'bower_components/fontawesome/scss',
            'bower_components/reveal.js/css'
          ]
        },
        files: {
          '<%= dirs.cssDest %>/<%= pkg.name %>.min.css': '<%= dirs.css %>/<%= pkg.name %>.scss',
          '<%= dirs.cssDest %>/<%= pkg.name %>-reveal.min.css': '<%= dirs.css %>/<%= pkg.name %>-reveal.scss'
        }
      }
    },
    concat: {
      dist: {
        files: {
          '<%= dirs.jsDest %>/<%= pkg.name %>.js': [
            'bower_components/jquery/dist/jquery.js',
            'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap.js',
            'node_modules/socket.io-client/dist/socket.io.js',
            'bower_components/marked/lib/marked.js',
            'bower_components/jquery.cookie/jquery.cookie.js',
            'resource/js/crowi.js'
          ],
          '<%= dirs.jsDest %>/<%= pkg.name %>-reveal.js': [
            'bower_components/jquery/dist/jquery.js',
            'bower_components/reveal.js/lib/js/head.min.js',
            'bower_components/reveal.js/lib/js/html5shiv.js',
            'bower_components/reveal.js/js/reveal.js'
          ],
        }
      },
    },
    uglify: {
      build: {
        files: {
          '<%= dirs.jsDest %>/<%= pkg.name %>.min.js': '<%= dirs.jsDest %>/<%= pkg.name %>.js',
          '<%= dirs.jsDest %>/<%= pkg.name %>-reveal.min.js': '<%= dirs.jsDest %>/<%= pkg.name %>-reveal.js'
        }
      }
    },
    jshint: {
      options: {
        jshintrc: true
      },
      all: paths.scripts
    },
    watch: {
      css: {
        files: paths.styles,
        tasks: ['sass'],
      },
      dev: {
        files: paths.all,
        tasks: ['dev'],
      },
      default: {
        files: paths.all,
        tasks: ['default'],
      },
    },
  });


  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-sass');


  // grunt watch dev
  grunt.registerTask('default', ['sass', 'concat', 'uglify']);
  grunt.registerTask('dev', ['jshint', 'sass:dev', 'concat']);

};
