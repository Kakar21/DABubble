import { Component } from '@angular/core';
import algoliasearch from 'algoliasearch/lite';


const searchClient = algoliasearch(
  '3J8L4AXINJ',
  '91fb598cc04a6d9416543564a4149609'
);

@Component({
  selector: 'search',
  standalone: true,
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent {
  config = {
    indexName: 'da_bubble',
    searchClient,
  };
}