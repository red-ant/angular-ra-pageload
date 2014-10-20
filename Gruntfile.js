module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    // Configure tasks
    pkg: grunt.file.readJSON('bower.json'),

    banner: '/*!\n' +
            ' * <%= pkg.name %>.js v<%= pkg.version %>\n' +
            ' * <%= pkg.homepage %>\n' +
            ' * Copyright <%= grunt.template.today("yyyy") %>\n' +
            ' * <%= pkg.license %> License\n' +
            ' */\n',

    jshint: {
      all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
    },

    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },

      dist: {
        src: ['src/**/*.js'],
        dest: '<%= pkg.name %>.js'
      }
    },

    ngAnnotate: {
      dist: {
        files: [{
          src: '<%= pkg.name %>.js',
          dest: '<%= pkg.name %>.min.js'
        }]
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>'
      },

      dist: {
        src: '<%= pkg.name %>.min.js',
        dest: '<%= pkg.name %>.min.js'
      }
    },

    clean: {
      dist: [
        '<%= pkg.name %>.js',
        '<%= pkg.name %>.min.js'
      ],

      docs: [
        'docs'
      ]
    },

    watch: {
      dist: {
        files: ['src/**/*.js'],
        tasks: ['build']
      },

      docs: {
        files: ['src/**/*.js'],
        tasks: ['docs']
      }
    },

    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        commitFiles: ['-a'],
        push: false,
        createTag: false
      }
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },

    jsdoc: {
      dist: {
        src: ['src/**/*.js'],
        options: {
          destination: 'docs',
          private: false
        }
      }
    },

    connect: {
      server: {
        options: {
          port: 9001,
          hostname: '0.0.0.0'
        }
      }
    }
  });

  // Load grunt tasks
  require('matchdep')
    .filterDev('grunt-*')
    .forEach(grunt.loadNpmTasks);

  // Register custom tasks
  grunt.registerTask('test', ['karma']);
  grunt.registerTask('build', ['jshint', 'clean:dist', 'concat', 'ngAnnotate', 'uglify']);
  grunt.registerTask('docs', ['clean:docs', 'jsdoc']);
};
