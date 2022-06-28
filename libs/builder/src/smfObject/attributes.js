const attributes = [
  "id",
  "isPassword",
  "image",
  "name",
  "page",
  "htmlText",
  "title",
  "text",
  "errorMessage",
  "count",
  "currentDuration",
  "totalDuration",
  "hint",
  "compassEnabled",
  "toggle",
  "rotateEnabled",
  "zoomEnabled",
  "scrollEnabled",
  "subtitle",
  "keyboardAppearance",
  "children",
  "parent",
  "align",
  "multiline",
  "orientation",
  "itemCount",
  "itemLength",
  "rowHeight",
  "safeAreaEnabled",
  "autoWidth",
  "autoHeight",
  "letterSpacing",
  "autoSizeEnabled",
  "borderVisibility",
  "backgroundModeEnabled"
];

var undefinedObject = {};
attributes.forEach(attr => undefinedObject[attr] = undefined);

module.exports = attributes;
module.exports.undefinedObject = undefinedObject;
