const androidResourceFolderRegexes = {
    3: /.+-ldpi/,
    4: /.+-mdpi/,
    6: /.+-hdpi/,
    8: /.+-xhdpi/,
    12: /.+-xxhdpi/,
    16: /.+-xxxhdpi/
};

export default function getScaleFactor(resourceFolderName: string): number {
    for (var i in androidResourceFolderRegexes) {
        var re = androidResourceFolderRegexes[i];
        re.lastIndex = 0;
        if (re.test(resourceFolderName)) {
            return Number(i);
        }
    }
}


