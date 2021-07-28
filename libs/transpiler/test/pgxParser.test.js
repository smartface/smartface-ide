const assert = require("chai").assert;
const purgeCache = require("./util").purgeCache;
const pgxData = require("./pgx.json");

const fs = require("fs");

describe('pgxParser', () =>  {
  var parser;
  
    beforeEach(()=> {
      purgeCache("../src/smfObject/pgxParser");
      parser = require("../src/smfObject/pgxParser");
    });
    
    it('should parse pgx data', function() {
      var data = parser(pgxData);
      //console.log(JSON.stringify(parser(pgxData),null,"\t"));
      //fs.writeFileSync("/home/ubuntu/workspace/workspace/aaa.json",JSON.stringify(data),"utf8");
      assert.equal(JSON.stringify(data), RES);
    });
    
});

const RES = '{"initialized":true,"name":"newPage001","pageName":"$NewPage001","smfObjects":[{"props":{"font":{"size":24}},"attributes":{"text":"button"},"font":{},"children":null,"degree":1,"id":"74f0-12e3-3c5d-428b","name":"button1","varName":"$Button1","parent":"newPage001","type":"Button","bundleID":"#newPage001_button1","parentID":"79af-b157-34fa-5fa3","parentType":"Page","className":".button"},{"props":{"left":0,"top":0,"font":{"size":50,"family":"Default"}},"attributes":{"text":"Button"},"font":{},"children":null,"degree":1,"id":"56ff-b4ea-db7d-0716","name":"button1_1_1","varName":"$Button1_1_1","parent":"newPage001","type":"Button","bundleID":"#newPage001_button1_1_1","parentID":"79af-b157-34fa-5fa3","parentType":"Page","className":".button"},{"props":{"top":0,"width":367.6923076923077,"height":250.76923076923077,"backgroundColor":"rgba( 231, 143, 143, 0.64 )","flexProps":{"justifyContent":"CENTER","alignItems":"CENTER","positionType":"RELATIVE"}},"attributes":{},"font":{},"children":null,"degree":1,"id":"25b2-4255-0f6b-f550","name":"LookbookItem","varName":"$LookbookItem","parent":"newPage001","type":"FlexLayout","bundleID":"#newPage001_LookbookItem","parentID":"79af-b157-34fa-5fa3","parentType":"Page","className":".flexLayout .flexLayout-default"},{"props":{"width":346.15384615384613,"height":201.53846153846152},"attributes":{},"font":{},"children":[{"name":"flShoppingBagItem","constructorName":"$ListView1$$FlShoppingBagItem"}],"degree":1,"id":"16b2-4f64-564a-604f","name":"listView1","varName":"$ListView1","parent":"newPage001","type":"ListView","bundleID":"#newPage001_listView1","parentID":"79af-b157-34fa-5fa3","parentType":"Page","className":".listView","smfObjects":[{"props":{"left":0,"top":0,"width":null,"height":60,"marginRight":null,"right":null,"flexProps":{"flexDirection":"ROW","justifyContent":"CENTER","positionType":"RELATIVE"}},"attributes":{},"font":{},"children":null,"degree":2,"id":"2b84-ae15-f259-260f","name":"flShoppingBagItem","varName":"$ListView1$$FlShoppingBagItem","parent":"listView1","type":"ListViewItem","bundleID":"#newPage001_listView1_flShoppingBagItem","parentID":"16b2-4f64-564a-604f","parentType":"ListView","className":".listViewItem"}]}],"footer":{"page":{"props":{},"attributes":{},"font":{},"children":[{"name":"statusBar","constructorName":"$NewPage001$$StatusBar"},{"name":"headerBar","constructorName":"$NewPage001$$HeaderBar"},{"name":"button1","constructorName":"$NewPage001$$Button1"},{"name":"button1_1_1","constructorName":"$NewPage001$$Button1_1_1"},{"name":"LookbookItem","constructorName":"$NewPage001$$LookbookItem"},{"name":"listView1","constructorName":"$NewPage001$$ListView1"}],"degree":0,"id":"79af-b157-34fa-5fa3","name":"newPage001","varName":"$NewPage001","parent":null,"type":"Page","bundleID":"#newPage001","parentID":null,"parentType":null,"className":".page"},"statusBar":{"props":{},"attributes":{},"font":{},"children":null,"degree":1,"id":"eb40-372d-c814-285b","name":"statusBar","varName":"$StatusBar","parent":"newPage001","type":"StatusBar","bundleID":"#newPage001_statusBar","parentID":"79af-b157-34fa-5fa3","parentType":"Page","className":".statusBar"},"headerBar":{"props":{},"attributes":{"title":"newPage001"},"font":{},"children":null,"degree":1,"id":"50ce-ae51-637e-7747","name":"headerBar","varName":"$HeaderBar","parent":"newPage001","type":"HeaderBar","bundleID":"#newPage001_headerBar","parentID":"79af-b157-34fa-5fa3","parentType":"Page","className":".headerBar"},"pageName":"$NewPage001"},"children":[{"name":"button1","constructorName":"$Button1"},{"name":"button1_1_1","constructorName":"$Button1_1_1"},{"name":"LookbookItem","constructorName":"$LookbookItem"},{"name":"listView1","constructorName":"$ListView1"}]}';
