import test from 'node:test';
import assert from 'node:assert/strict';
import {keyboardOverlap,scrollToReveal} from '../js/viewport.js';
test('Keyboard geometry retains scene size and ignores small browser toolbar changes',()=>{
 assert.equal(keyboardOverlap(1024,600),424);
 assert.equal(keyboardOverlap(1024,980),0);
 assert.equal(keyboardOverlap(1024,1024,340),340);
 assert.equal(keyboardOverlap(1024,1024),0);
});
test('Only covered fields move within the dialog, with minimal scroll and support for tall text',()=>{
 assert.equal(scrollToReveal({top:180,bottom:240},100,500),0);
 assert.equal(scrollToReveal({top:460,bottom:520},100,500),20);
 assert.equal(scrollToReveal({top:70,bottom:130},100,500),-30);
 assert.equal(scrollToReveal({top:200,bottom:700},100,500),100);
});
