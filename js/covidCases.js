//  Javascript for Covid-19 cases statistics 
//  Implementing a web service to get the JSON data from a remote server asynchronously
//  AUTHOR: Diwen Zhang
//  EMAIL:  zhangdiw@sheridancollege.ca
//  CREATED: 2021-06-30
//  UPDATED: 2021-07-2

let go = {};
const MS_PER_DAY = 24 * 60 * 60 * 1000;
$(document).ready(() => {
    //log("page is load");

    let option = {
        url: "http://ejd.songho.ca/ios/covid19.json",
        type: "GET",
        dataType: "json",
    }

    $.ajax(option).then(json => {
        go.json = json; 
        //init province
        updateProvinces("Canada");
        $("#province").prop("selectedIndex",0);
        //event handler
        $("select[id='province']").change(function(){
            updateProvinces($(this).val());
        });
        $("#prev").click(function(){
            if("2020-01-31".localeCompare($("#date .date").text())<0){
                prevDate();
            }else{
                //give a caution when no data before the date
                alert("There is no data before 2020-01-31");
            }
        });
        $("#next").click(function(){
            if(($("#date .date").text()).localeCompare(go.lastdate)<0){
                nextDate();
            }else{
                //give a caution when no data renew
                alert("There is no data after "+go.lastdate);
            }
        });
    }).catch(() => log("Error,fail to load"));
});

function updateProvinces(value) {
    go.arr = go.json.filter(e=>e.prname==value);
    //replace(/-/g,"/") for compatible with firefox
    go.arr.sort((a,b)=>{return Date.parse(a.date.replace(/-/g,"/"))-Date.parse(b.date.replace(/-/g,"/"))});
    go.lastdaily=(go.arr[go.arr.length-1].numtoday).toLocaleString();
    go.lasttotal=(go.arr[go.arr.length-1].numtotal).toLocaleString();
    go.lastdate=go.arr[go.arr.length-1].date;
    $("#daily_cases").html(go.lastdaily);        
    $("#total_cases").html(go.lasttotal); 
    $("#date .date").html(go.lastdate); 
    //init the chart when select province 
    updateChart(go.lastdate);
}

function prevDate(){
    let str = $("#date .date").text().split("-");
    let year = parseInt(str[0]);
    let month = parseInt(str[1]);
    let day = parseInt(str[2]);
    let newDate="";
    if(month==1 && day==1){
        newDate=(year-1)+"-12-31";
    }else if(month==3 && day ==1){
        if((year%4==0 && year%100!=0) || year%400==0){
            newDate=year+"-02-29";
        }else{
            newDate=year+"-02-28";
        }     
    }else if(day==1 && (month==2||month==4||month==6||month==8||month==9||month==11)){
        newDate=year+"-"+(month<11?"0"+(month-1):month-1)+"-"+"31";
    }else if(day==1 && (month==5||month==7||month==10||month==12)){
        newDate=year+"-"+(month<11?"0"+(month-1):month-1)+"-"+"30";
    }else{
        newDate=year+"-"+str[1]+"-"+(day<11?"0"+(day-1):day-1);
    }
    $("#date .date").html(newDate);
    let newData = go.arr.filter(e=>e.date==newDate);
    if(newData.length){
        $("#daily_cases").html(newData[0].numtoday.toLocaleString());        
        $("#total_cases").html(newData[0].numtotal.toLocaleString()); 
    }else{
        //when choose date doesnt have data, let the num of daily become zero as well nothing change for total 
        $("#daily_cases").html("0");
    } 
    //change chart when change the date
    updateChart($("#date .date").text());
}

function nextDate(){
    let str = $("#date .date").text().split("-");
    let year = parseInt(str[0]);
    let month = parseInt(str[1]);
    let day = parseInt(str[2]);
    let newDate = "";
    if(month==12 && day==31){
        newDate=(year+1)+"-01-01";
    }else if(month==2 && (day>=28)){
        if((year%4==0 && year%100!=0) || year%400==0){
            if(day==28){ newDate=year+"-02-29"; }
            else{ newDate=year+"-03-01"; }
        }else{
            newDate=year+"-03-01";
        }     
    }else if(day==31 && (month==1||month==3||month==5||month==7||month==8||month==10)){
        newDate=year+"-"+(month<9?"0"+(month+1):month+1)+"-"+"01";
    }else if(day==30 && (month==4||month==6||month==9||month==11)){
        newDate=year+"-"+(month<9?"0"+(month+1):month+1)+"-"+"01";
    }else{
        newDate=year+"-"+str[1]+"-"+(day<9?"0"+(day+1):day+1);
    }
    $("#date .date").html(newDate);
    let newData = go.arr.filter(e=>e.date==newDate);
    $("#daily_cases").html(newData[0].numtoday.toLocaleString());        
    $("#total_cases").html(newData[0].numtotal.toLocaleString()); 
    if(newData.length){
        $("#daily_cases").html(newData[0].numtoday.toLocaleString());        
        $("#total_cases").html(newData[0].numtotal.toLocaleString()); 
    }else{
        $("#daily_cases").html("0");
    }
    updateChart($("#date .date").text());
}

function drawChart(xValues, yValues){
    if(go.chart)  go.chart.destroy();
    let context = document.getElementById("chart").getContext("2d");
    go.chart = new Chart(context,
    {
        type:"line",           
        data:
        {
            labels: xValues,  
            datasets:
            [{
                data: yValues, 
                backgroundColor: 'rgba(23,143,223,0.7)',     
                lineTension: 0,     
            }]
        },
        options:
        {
            maintainAspectRatio: false, 
            title:
            {
                display: true,
                text: "Daily Confirmed Cases",
                fontSize: 16
            },
            legend:
            {
                display:false
            }
        }
    });
}

function updateChart(time){
    let ctr=0;
    let time1 = new Date(go.arr[0].date).getTime(); 
    let time2 = new Date(time).getTime();
    let dateCount = (time2-time1) / MS_PER_DAY + 1;
    for(let e of go.arr){
        ctr++;
        if(!(e.date.localeCompare(time)))
        dateCount = ctr;
    }
    let values = new Array(dateCount).fill(0);
    let dates = new Array(dateCount).fill(0);
    let cnt=0;
    for(let e of go.arr){
        if(cnt<dateCount){
            values[cnt] = e.numtoday;
            dates[cnt]= e.date;
        }else break;
        cnt++;
    }
    drawChart(dates, values);
}
