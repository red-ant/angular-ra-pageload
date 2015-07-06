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
     options: {
       singleQuotes: true
     },

      dist: {
        files: [{
          src: '<%= pkg.name %>.js',
          dest: '<%= pkg.name %>.js'
        }]
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>'
      },

      dist: {
        src: '<%= pkg.name %>.js',
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
        updateConfigs: ['pkg'],
        commitFiles: ['-a'],
        pushTo: 'upstream master',
        push: true,
        createTag: true
      }
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },

    ngdocs: {
      options: {
        html5Mode: false,
        startPage: '/api'
      },

      api: {
        api: true,
        src: ['src/**/*.js'],
        title: 'API Reference'
      }
    },

    connect: {
      server: {
        options: {
          port: 9001,
          hostname: '0.0.0.0',
          keepalive: true
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
  grunt.registerTask('docs', ['clean:docs', 'ngdocs:api']);

  grunt.registerTask('release', function(bumpLevel) {
    grunt.task.run([
      'bump-only:' + (bumpLevel || 'patch'),
      'build',
      'docs',
      'bump-commit'
    ]);
  });
};
