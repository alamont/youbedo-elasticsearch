#### Lege query (alleen aggregatie van subject codes)
```
{
    "aggs": {
        "subjects": {
            "terms": {
                "field": "DescriptiveDetail.Subject.SubjectCode"
            }
        }
    }
}
```

#### Complexe query met alles er op en er aan
```json
{
    "query": {
        "filtered": {
            "query": {
                "multi_match": {
                    "query": <string>,
                    "fields": [
                        "DescriptiveDetail.TitleDetail.TitleElement.TitleText^3",
                        "DescriptiveDetail.TitleDetail.TitleElement.Subtitle",
                        "DescriptiveDetail.Contributor.NamesBeforeKey",
                        "DescriptiveDetail.Contributor.KeyNames",
                        "CollateralDetail.TextContent.Text",
                        "PublisingDetail.Imprint.ImprintName",
                        "PublisingDetail.Publisher.PublisherName"
                    ]
                }
            },
            "filter": {
                "bool": {
                    "must": [
                        { "range": { "ProductSupply.SupplyDetail.Price.PriceAmount": { "gte": <float>, "lte": <float> } } },
                        { "range": { "ProductSupply.SupplyDetail.Price.PriceDate.Date._": { "gte": <date>, "lte": <date> } } },
                        { "term": { "ProductSupply.SupplyDetail.Price.PriceType": <string> } },

                        { "term": { "ProductSupply.SupplyDetail.ProductAvailability": <string> } },
                        { "range": { "ProductSupply.SupplyDetail.SupplyDate.Date._": { "lte": <date> } } },
                        { "exists": { "field": "ProductSupply.SupplyDetail.SupplyDate" } },

                        { "term": { "PublishingDetail.PublishingStatus": <string> } },
                        { "range": { "PublishingDetail.PublishingDate.Date._": { "gte": <date>, "lte": <date> } } },

                        { "terms": { "DescriptiveDetail.Subject.SubjectCode": <array<integer>> } },

                        { "exists" : { "field": "CollateralDetail.CitedContent" } },
                        { "exists" : { "field": "CollateralDetail.SupportingResource" } }
                    ]
                }
            }
        }
    },
    "aggs": {
        "subjects": {
            "terms": {
                "field": "DescriptiveDetail.Subject.SubjectCode"
            }
        }
    }
}
```

#### Opmerkingen
- `"DescriptiveDetail.TitleDetail.TitleElement.TitleText^3"` betekend dat dit veld 3x zo belangrijk is in de relevantie bepaling.
- Relevantie bepaling op `ProductSupply.SupplyDetail.ProductAvailability` is mogelijk maar complex doordat deze veel verschillende waarden kan aannemen. Voor nu heeft het geen invloed op de relevantie.
- `ProductSupply.SupplyDetail.Price` wordt niet platgeslagen waardoor de queries op deze velden per `Price` element gaan. Met andere woorden als er meerde `Price` elementen zijn zullen voor een match alle filters voor één van die elementen moeten matchen.
- `ProductSupply.SupplyDetail.Price.PriceDate.PriceDateRole` is volgens mij altijd 14 en heeft verder geen invloed op de query.
- `ProductSupply.SupplyDetail.Price` is volgens mij altijd een array van minstens twee elementen met  `PriceType` 01 en 04.
