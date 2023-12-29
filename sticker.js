export default class Sticker {
      static #customElements = new Map();
      /**
       * @hideconstructor
       */
      constructor(){};
      static #defineComponent(name){
            const template = document.getElementById(name);
            if( !template ){
                  console.warn(`component ${name} doesn't exist`);
                  return;
            }
            customElements.define(`${name}-component`, class extends HTMLDivElement {
                  #text = template.innerHTML;
                  #shadow;
                  #wrapper = document.createElement('div');
                  #attributes = new Map();
                  constructor(attributes = []){
                        super();
                        this.#shadow = this.attachShadow({mode: 'open'});
                        this.#shadow.append(this.#wrapper);
                        this.#wrapper.innerHTML = this.#text;
                  }
                  #serialize(){
                        let text = this.#text;
                        for( let [key, value] of this.#attributes.entries() ){
                              text = text.replace(`{{${key}}}`, value);
                        }
                        this.#wrapper.innerHTML = text;
                  }
                  /**
                   * 
                   * @param {string} key the attribute name
                   * @param {string} value the attribute value
                   * if needed, refresh the component
                   */
                  setAttribute(key, value){
                        const attrib = this.#attributes.get(key);
                        if( !attrib || attrib != value ){
                              this.#attributes.set( key, value );
                              this.#serialize();
                        }
                  }
                  setAttributeWithoutRefreshing(key, value){
                        const attrib = this.#attributes.get(key);
                        if( !attrib || attrib != value ){
                              this.#attributes.set( key, value );
                        }
                  }
                  refresh(){
                        this.#serialize();
                  }
            }, { extends: 'div'});
            const elem = document.createElement('div', {is: `${name}-component`});
            if( !elem ){
                  console.warn(`something went wrong in component ${name} creation`);
                  return;
            }
            this.#customElements.set(name, elem);
            return elem;
      }
      /**
       * 
       * @param {string} name 
       * @returns {HTMLDivElement} 
       */
      static #createComponent(name){
            if( !this.#customElements.get(name) && !this.#defineComponent(name) ){
                  return;
            }
            return this.#customElements.get(name).cloneNode(true);
      }
      /**
       * 
       * @param {string} name 
       * @param {HTMLElement} node 
       */
      static append(name, node = document.body){
            const elem = this.#createComponent(name);
            node.appendChild(elem);
            return elem;
      }
      /**
       * @param {string} name component name
       * @param {Record<string,string>[]} attributes components attributes
       * @returns {(node: HTMLElement)=>void} function that create element for each element of the attributes array
       */
      static for(name,attributes){
            const create = (attribs, node)=>{
                  const elem = this.#createComponent(name);
                  for( const [key,attrib] of Object.entries(attribs) ){
                        elem.setAttributeWithoutRefreshing(key,attrib);
                  }
                  elem.refresh();
                  node.append(elem);
            }
            return (node = document.body)=>{
                  for( let attribs of attributes ){
                        create(attribs, node);
                  }
            }
      }
      /**
       * 
       * if condition is true, append custom element
       * @param {string} name name of the component
       * @param { boolean } condition condition to check
       * @param {HTMLElement} node
       */
      static if( name, condition, node = document.body ){
            if( condition ){
                  this.append( name, node );
            }
      }
      /**
       * 
       * if condition is true, append custom first specified custom element, else append second custom element
       * @param {string} ifName name of the component appended if condition is true
       * @param {string} elseName name of the component appended if condition is false
       * @param { boolean } condition condition to check
       * @param {HTMLElement} node
       */
      static ifElse( ifName, elseName, condition, node = document.body ){
            if( condition ){
                  this.append( ifName, node );
            }else{
                  this.append( elseName, node );
            }
      }
}

export class SRouter {
      /**
       * @type HTMLDivElement
       */
      static #app;
      static #routes = {};

      /**
       * @hideconstructor
       */
      constructor(){};
      
      static create(){
            this.#app = document.createElement( 'div' );
            if( !this.#app )
                  throw "cannot create the app router";
      }
      /**
       * 
       * @param {Record<string,string>} routes contains all routes of the app. The object has keys that are the name of the route and the values are the actual components used to represent the page
       * @example 
      project structure
      -home.html
      -about.html
      -main.html
      
      in main.html
      ```
      <sticker>
      #use home.html as home dynamic;
      #use about.html as about dynamic;
      </sticker>
      ```
      ...
      in js
      ...

      ```javascript
      const routes = {
            '/home' : 'home',
            '/about' : 'about'
      };
      SRouter.map( routes );
      ```
       */
      static map( routes ){
            if( typeof routes !== 'object' )
                  throw `cannot use routes because are not of type Record<string,string>`;
            for( let [k,v] of Object.entries(routes) ){
                  if( typeof v !== 'string' || k !== 'string' ){
                        console.warn(`route ${k} not added because it or the component name are not of type string`);
                        continue;
                  }
                  this.#routes[k] = v;
            }
      }
      /**
       * add a route to the routes registry. if routes already exists, it will be overwritten.
       * @param {string} route name
       * @param {string} componentName saved in component registry as dynamic component.
       */
      static add( route, componentName ){
            if( typeof route === 'string' || componentName !== 'string' ){
                  console.warn(`route ${route} not added because it or the component name are not of type string`);
                  return;
            }
            this.#routes[route] = componentName;
      }
      /**
       * delete given route
       * @param {string} route 
       */
      static delete( route ) {
            if( typeof route !== 'string' || !( route in this.#routes ) )
                  return;
            delete this.#routes[ route ];
      }
      /**
       * go to the specified route
       * @param {string} route 
       */
      static goto( route ){
            if( typeof route !== 'string' || !( route in this.#routes ) ){
                  console.error( `Invalid route. route ${route} does not exist` )
                  return;
            }
            this.#app.innerHTML = '';
            Sticker.append( this.#routes[ route ], this.#app );
      }
}