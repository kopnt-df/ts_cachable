/* ------------------------------------------------------------ Imports ----------------------------------------------------------- */

// Local
import { CachableGroup } from './cachableGroup'

/* -------------------------------------------------------------------------------------------------------------------------------- */

interface ITest {
  test: string
}

const item = {
  test: 'test'
}

const cg = new CachableGroup<ITest>('test', 0, true)
cg.setItem('test2', item)

console.log(cg.getItem('test2'))