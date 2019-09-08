<template>
  <div>
    <img :src="src" width height />
    <div class="toolbar">
      <button class="bar-button" @click="toChapter(prev)">{{prev}}</button>
      <button class="bar-button" @click="previousPage">&#60;</button>
      <button class="bar-button" @click="getPageInfo(chapterID)">{{ `${page}/${pageCount}` }}</button>
      <button class="bar-button" @click="nextPage">></button>
      <button class="bar-button" @click="toChapter(next)">{{next}}</button>
    </div>
  </div>
</template>

<script>
const axios = require("axios");
export default {
  name: "HelloWorld",
  data() {
    return {
      comicID: 55,
      chapterID: 8412,
      page: 1,
      pageCount: null,
      prev: null,
      next: null
    };
  },
  computed: {
    src() {
      return `http://10.0.0.3:8080/manga?comicID=${this.comicID}&chapterID=${this.chapterID}&page=${this.page}`;
    }
  },
  watch: {
    chapterID(newChapterID) {
      console.log(newChapterID)
      this.pageCount = null;
      this.prev = null;
      this.next = null;
      this.getPageInfo(newChapterID);
    }
  },
  methods: {
    nextPage() {
      this.page = this.pageCount ? Math.min(this.page + 1, this.pageCount) : this.page + 1;
    },
    previousPage() {
      this.page = Math.max(this.page - 1, 1);
    },
    toChapter(chapterID) {
      if (!chapterID) {
        console.log('chapterID == null');
        return;
      }
      this.chapterID = chapterID;
      this.page = 1;
    },
    getPageInfo(chapterID) {
      if (!chapterID) {
        console.log('chapterID == null');
        return;
      }
      var url = `/pageInfo?comicID=55&chapterID=${chapterID}`;
      console.log('request ' + url);
      var that = this;
      axios
        .get(url, { baseURL: 'http://10.0.0.3:8080'})
        .then(function(response) {
          that.pageCount = response.data.urls.length;
          that.prev = response.data.prev;
          that.next = response.data.next;
          console.log('response ' + url);
          console.log(that.pageCount, that.prev, that.next);
        })
        .catch(function(error) {
          // handle error
          console.log(error);
        })
        .finally(function() {
          // always executed
        });
    }
  },
  mounted() {
    this.getPageInfo(this.chapterID);
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
img {
  max-width: 100%;
  height: auto;
}
.toolbar {
  position: fixed;
  left: 0;
  bottom: 0;
  right: 0;
  height: 40px;

  display: flex;
  flex-direction: row;
}
.bar-button {
  flex: 1;
  background-color: black;
  color: white;
}
</style>
