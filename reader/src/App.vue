<template>
  <div id="app">
    <reader/>
  </div>
</template>

<script>
import reader from './components/reader.vue'

export default {
  name: 'app',
  components: {
    reader
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
