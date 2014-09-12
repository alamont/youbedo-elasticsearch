var parse = require('csv-parse');
var fs = require('fs');
var traverse = require('traverse');
var util = require('util');

parseCSV = function(csv_str, callback){

  reverseDate = function(date_str){
    //DDMMYYYY -> YYYYMMDD
    if (date_str) {
      year = date_str.slice(4,8)
      month = date_str.slice(2,4)
      day = date_str.slice(0,2)
      return year + month + day;
    } else {
      return false;
    }
  }

  book_base_json =
  {
    RecordReference: "[**EAN**]",
    NotificationType: "04",
    ProductIdentifier: {
      ProductIDType: "03",
      IDValue: "[**EAN**]"
    },
    DescriptiveDetail: {
      ProductComposition: "00",
      ProductForm: "[**PRODUCT_VORM**]",
      ProductFormDetail: "[**PRODUCT_VORM_DETAIL**]",
      EpubTechnicalProtection: "[**PRODUCT_VORM_DETAIL**]",
      TitleDetail: [
        {
          TitleType: "01",
          TitleElement: [
            {
              TitleElementLevel: "01",
              TitleText: "[**TITEL**]",
              Subtitle: "[**SUBTITEL**]"
            }
          ]
        },
        {
          TitleType: "10",
          TitleElement: {
            TitleElementLevel: "01",
            TitleText: "[**AUTEUR_TITEL**]"
          }
        },
        {
          TitleType: "11",
          TitleElement: {
            TitleElementLevel: "01",
            TitleText: "[**COMMERCIELE_TITEL**]"
          }
        }
      ],
      Contributor: [
        {
          SequenceNumber: "1",
          ContributorRole: "A01",
          NamesBeforeKey: "[**HFDAUT_VOORL**]",
          PrefixToKey: "[**HFDAUT_VOORVGSL**]",
          KeyNames: "[**HFDAUT_ANAAM**]"
        }
      ],
      EditionNumber: "[**BIBLIOGRAFISCHE_DRUK**]",
      Language: {
        LanguageRole: "01",
        LanguageCode: "[**TAAL_KD**]"
      },
      Extent: [
        {
          ExtentType: "80",
          ExtentValue: "[**AANTAL_PAGINAS**]",
          ExtentUnit: "03"
        },
        {
          ExtentType: "22",
          ExtentValue: "[**BESTANDSGROOTTE**]",
          ExtentUnit: "03"
        }
      ],
      Illustrated: "[**BESTANDSGROOTTE**]",
      Subject: {
        MainSubject: {},
        SubjectSchemeIdentifier: "32",
        SubjectCode: "[**NUR_KD**]"
      }
    },
    CollateralDetail: {
      TextContent: {
        TextType: "05",
        ContentAudience: "03",
        Text: "[**BESCHRIJVING**]"
      },
      SupportingResource: [
        {
          ResourceContentType: "01",
          ContentAudience: "03",
          ResourceMode: "03",
          ResourceVersion: {
            ResourceForm: "02",
            ResourceLink: "[**AFBEELDING**]",
          }
        }
      ]
    },
    PublishingDetail: {
      Imprint: {
        ImprintName: "[**IMPRINT_NM**]"
      },
      Publisher: {
        PublishingRole: "01",
        PublisherIdentifier: {
          PublisherIDType: "10",
          IDValue: "[**UITGEVER_ID**]"
        },
        PublisherName: "[**UITGEVER_NM**]"
      },
      PublishingStatus: "[**STADIUM_LEVENSCYCLUS_KD**]",
      PublishingDate: {
        PublishingDateRole: "01",
        Date: {
          _: "[**COMM_VERSCHIJNINGSDATUM**]",
          "$": {
            dateformat: "00"
          }
        }
      }
    },
    RelatedMaterial: [],
    ProductSupply: {
      SupplyDetail: {
        ProductAvailability: "[**STADIUM_LEVENSCYCLUS_KD|MAG_BESTELLEN_IND**]",
        SupplyDate: {
          SupplyDateRole: "08",
          Date: {
            _: "[**COMM_VERSCHIJNINGSDATUM**]",
            "$" : {
              dateformat: "00"
            }
          }
        },
        Price: [
          {
            PriceType: "05",
            PriceCondition: {
              PriceConditionType: "00"
            },
            DiscountCoded: {
              DiscountCodeType: "03",
              DiscountCode: "O"
            },
            PriceAmount: "[**PRICEAMOUNT**]",
            Tax: {
              TaxRateCode: "S",
              TaxableAmount: "[**NETTOPRIJS**]"
            },
            CurrencyCode: "EUR",
          }
        ]
      }
    }
  }

  GEILLUSTREERD_IND_ENUM = {"J": "01", "N": "02"};
  STADIUM_LEVENSCYCLUS_KD_ENUM = { "A": "02", "V": "04", "N": "01", "T": "09", "H": "04" };

  STADIUM_LEVENSCYCLUS_KD_PRODUCT_AVAILABILITY_ENUM = { "A": "10", "V": "21", "N": "01", "T": "40", "H": "32" };


  var parser = parse({delimiter: '\t', columns: true,  quote: ''});
  var books = [];
  var i = 0;
  parser.on('readable', function(){
    while(record = parser.read()){
      // output.push(record);
      i = i + 1;
      json = JSON.parse(JSON.stringify(book_base_json));

      //First Pass
      traverse(json).forEach(function (x) {
        if (this.isLeaf && (typeof x == 'string' || x instanceof String) && x.search(/^\[\*\*.*\*\*\]$/) >= 0){
          this.update(record[(/^\[\*\*(.*)\*\*\]$/).exec(x)[1]]);
        }
      });

      if (record.COAUT_1_ANAAM.length > 0) { json.DescriptiveDetail.Contributor.push( { SequenceNumber: "2", ContributorRole: "A01", NamesBeforeKey: record.COAUT_1_VOORL, PrefixToKey: record.COAUT_1_VOORVGSL, KeyNames: record.COAUT_1_ANAAM } ); }
      if (record.COAUT_2_ANAAM.length > 0) { json.DescriptiveDetail.Contributor.push( { SequenceNumber: "2", ContributorRole: "A01", NamesBeforeKey: record.COAUT_2_VOORL, PrefixToKey: record.COAUT_2_VOORVGSL, KeyNames: record.COAUT_2_ANAAM } ); }

      if (record.REDSAM_1_ANAAM.length > 0) { json.DescriptiveDetail.Contributor.push( { SequenceNumber: "2", ContributorRole: "A01", NamesBeforeKey: record.REDSAM_1_VOORL, PrefixToKey: record.REDSAM_1_VOORVGSL, KeyNames: record.REDSAM_1_ANAAM } ); }
      if (record.REDSAM_2_ANAAM.length > 0) { json.DescriptiveDetail.Contributor.push( { SequenceNumber: "2", ContributorRole: "A01", NamesBeforeKey: record.REDSAM_2_VOORL, PrefixToKey: record.REDSAM_2_VOORVGSL, KeyNames: record.REDSAM_2_ANAAM } ); }
      if (record.REDSAM_3_ANAAM.length > 0) { json.DescriptiveDetail.Contributor.push( { SequenceNumber: "2", ContributorRole: "A01", NamesBeforeKey: record.REDSAM_3_VOORL, PrefixToKey: record.REDSAM_3_VOORVGSL, KeyNames: record.REDSAM_3_ANAAM } ); }

      if (record.BEW_1_ANAAM.length > 0) { json.DescriptiveDetail.Contributor.push( { SequenceNumber: "2", ContributorRole: "A01", NamesBeforeKey: record.BEW_1_VOORL, PrefixToKey: record.BEW_1_VOORVGSL, KeyNames: record.BEW_1_ANAAM } ); }
      if (record.BEW_2_ANAAM.length > 0) { json.DescriptiveDetail.Contributor.push( { SequenceNumber: "2", ContributorRole: "A01", NamesBeforeKey: record.BEW_2_VOORL, PrefixToKey: record.BEW_2_VOORVGSL, KeyNames: record.BEW_2_ANAAM } ); }
      if (record.BEW_3_ANAAM.length > 0) { json.DescriptiveDetail.Contributor.push( { SequenceNumber: "2", ContributorRole: "A01", NamesBeforeKey: record.BEW_3_VOORL, PrefixToKey: record.BEW_3_VOORVGSL, KeyNames: record.BEW_3_ANAAM } ); }

      if (record.ILL_1_ANAAM.length > 0) { json.DescriptiveDetail.Contributor.push( { SequenceNumber: "2", ContributorRole: "A01", NamesBeforeKey: record.ILL_1_VOORL, PrefixToKey: record.ILL_1_VOORVGSL, KeyNames: record.ILL_1_ANAAM } ); }
      if (record.ILL_2_ANAAM.length > 0) { json.DescriptiveDetail.Contributor.push( { SequenceNumber: "2", ContributorRole: "A01", NamesBeforeKey: record.ILL_2_VOORL, PrefixToKey: record.ILL_2_VOORVGSL, KeyNames: record.ILL_2_ANAAM } ); }
      if (record.ILL_3_ANAAM.length > 0) { json.DescriptiveDetail.Contributor.push( { SequenceNumber: "2", ContributorRole: "A01", NamesBeforeKey: record.ILL_3_VOORL, PrefixToKey: record.ILL_3_VOORVGSL, KeyNames: record.ILL_3_ANAAM } ); }

      if (record.VERT_1_ANAAM.length > 0) { json.DescriptiveDetail.Contributor.push( { SequenceNumber: "2", ContributorRole: "A01", NamesBeforeKey: record.VERT_1_VOORL, PrefixToKey: record.VERT_1_VOORVGSL, KeyNames: record.VERT_1_ANAAM } ); }
      if (record.VERT_2_ANAAM.length > 0) { json.DescriptiveDetail.Contributor.push( { SequenceNumber: "2", ContributorRole: "A01", NamesBeforeKey: record.VERT_2_VOORL, PrefixToKey: record.VERT_2_VOORVGSL, KeyNames: record.VERT_2_ANAAM } ); }
      if (record.VERT_3_ANAAM.length > 0) { json.DescriptiveDetail.Contributor.push( { SequenceNumber: "2", ContributorRole: "A01", NamesBeforeKey: record.VERT_3_VOORL, PrefixToKey: record.VERT_3_VOORVGSL, KeyNames: record.VERT_3_ANAAM } ); }

      json.DescriptiveDetail.Illustrated = GEILLUSTREERD_IND_ENUM[record.GEILLUSTREERD_IND];
      json.PublishingDetail.PublishingStatus = STADIUM_LEVENSCYCLUS_KD_ENUM[record.STADIUM_LEVENSCYCLUS_KD];

      if (record.ISBN_FYSIEK_BOEK.length > 0) { json.RelatedMaterial.push({ RelatedProduct: { ProductRelationCode: "13", ProductIdentifier: { ProductIDType: "03", IDValue: record.ISBN_FYSIEK_BOEK } } } ); }
      if (record.VERVANGEND_ARTIKEL_KD.length > 0) { json.RelatedMaterial.push({ RelatedProduct: { ProductRelationCode: "05", ProductIdentifier: { ProductIDType: "03", IDValue: record.VERVANGEND_ARTIKEL_KD } } } ); }

      if (record.MAG_BESTELLEN_IND == "N"){
        json.ProductSupply.SupplyDetail.ProductAvailability = "01";
      } else {
        json.ProductSupply.SupplyDetail.ProductAvailability = STADIUM_LEVENSCYCLUS_KD_PRODUCT_AVAILABILITY_ENUM[record.STADIUM_LEVENSCYCLUS_KD];
      }

      json.ProductSupply.SupplyDetail.Price[0].PriceAmount = parseFloat(record.NETTOPRIJS) + parseFloat(record.BEDRAG_BTW_HOOG);

      json.PublishingDetail.PublishingDate.Date._ = reverseDate(json.PublishingDetail.PublishingDate.Date._);
      json.ProductSupply.SupplyDetail.SupplyDate.Date._ = reverseDate(json.ProductSupply.SupplyDetail.SupplyDate.Date._);

      json.CSVDetail = record;

      books.push(json);
      console.log("Parsed E-Book " + i);
    }
  });

  parser.on('error', function(err){
    console.log(err.message);
    callback("Some Parsing Error", undefined);
  });

  parser.on('finish', function(){
    console.log("Finished!");
    callback(false, books);
    books = null;
  });

  parser.write(csv_str);
  parser.end();

}
