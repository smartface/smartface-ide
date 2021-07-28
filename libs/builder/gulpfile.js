const gulp = require('gulp');
const through = require('through2');

gulp.task('demo', () => gulp.src('/home/ubuntu/workspace/workspace/.ui/page1.pgx')
  .pipe(through.obj((file, encoding, callback) => {
    if (file.isNull()) return callback(null, file);
    return callback(null, file);
  })).pipe(gulp.dest('/home/ubuntu/workspace/workspace/dist')));
