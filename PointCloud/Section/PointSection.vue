<template>
    <dialogcomwithborder :width=352 :height=316 :left=1275 :top=300 :resizable=true v-show="isShow" :onclose-callback="close" title="点云剖面" headerhaloclassname="headhalo1">

        <div class="position-absolute" :id=pointcloudsectioncontainid style="top:50px;bottom:20px;left:6px;right:6px;"></div>
        <img src="static/images/common/halo_232X2.png" class="width100percent position-absolute" style="height:3px;bottom:20px;">
    </dialogcomwithborder>
</template>

<script>
    import basemixins from '../../../common/buss/util/baseMixins'
    import Dialogcomwithborder from "../../../common/components/UtilityCom/dialogcomwithborder";
    import pointclasshandler from '../buss/PointClassificationHandler'



    export default {
        name: "PointSection",
        components: {Dialogcomwithborder},
        data:function(){
            return {
                pointcloudsectioncontainid:"",
            }
        },

        mixins:[basemixins.DATA_ISSHOW,basemixins.METHODS_CLOSE],
        methods:{

        },
        mounted(){
            this.pointcloudsectioncontainid=pointclasshandler.PointCloudSectionContainerID;
        },
        watch:{
            isShow(newval,oldval){
                if(!newval)
                {

                    pointclasshandler.ClearEntity();
                }
            }
        }

    }
</script>

<style scoped>

</style>
